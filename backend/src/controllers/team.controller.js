"use strict";

const { z } = require("zod");
const { User, TenantUser, TenantRole } = require("../models");
const { apiSuccess, ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword } = require("../utils/password");
const { randomCode } = require("../utils/ids");
const { permissionGroupsFor } = require("../seed/roles");

/** Only an Owner (the "*" wildcard permission) may grant/revoke ownership. */
function isOwner(req) {
  // Platform super admins acting cross-tenant have unrestricted rights.
  if (req.user && req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return true;
  const perms = req.permissions || [];
  return perms.includes("*");
}

function slugifyRole(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function ownerRoleId(tenantId) {
  const role = await TenantRole.findOne({ tenantId, slug: "owner" }).select("_id").lean();
  return role ? String(role._id) : null;
}

async function activeOwnerCount(tenantId) {
  const roleId = await ownerRoleId(tenantId);
  if (!roleId) return 0;
  return TenantUser.countDocuments({ tenantId, roleId, isActive: true });
}

function shapeMember(m) {
  if (!m.userId) return null;
  return {
    id: String(m._id),
    userId: String(m.userId._id),
    name: m.userId.name,
    email: m.userId.email,
    phone: m.userId.phone || null,
    status: m.userId.status,
    lastLoginAt: m.userId.lastLoginAt || null,
    joinedAt: m.createdAt,
    isActive: m.isActive,
    role: m.role ? { id: String(m.role._id), name: m.role.name, slug: m.role.slug } : null,
  };
}

// ── Members ──────────────────────────────────────────────
const listMembers = asyncHandler(async (req, res) => {
  const memberships = await TenantUser.find({ tenantId: req.tenantId })
    .populate("userId", "name email phone status lastLoginAt createdAt")
    .populate("role", "name slug")
    .sort({ createdAt: 1 })
    .lean();

  let members = memberships.map(shapeMember).filter(Boolean);

  const search = String(req.query.search || "").trim().toLowerCase();
  if (search) {
    members = members.filter(
      (m) => m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search)
    );
  }
  if (req.query.role) members = members.filter((m) => m.role && m.role.slug === req.query.role);

  return apiSuccess(res, { members, total: members.length });
});

const createMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  phone: z.string().optional(),
  roleId: z.string().min(1),
});

function nameFromEmail(email) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

const createMember = asyncHandler(async (req, res) => {
  const data = createMemberSchema.parse(req.body);

  const role = await TenantRole.findOne({ _id: data.roleId, tenantId: req.tenantId });
  if (!role) throw ApiError.badRequest("Invalid role for this tenant");
  if (role.slug === "owner" && !isOwner(req)) throw ApiError.forbidden("Only an owner can assign the Owner role");

  const email = data.email.toLowerCase();
  if (await User.findOne({ email })) throw ApiError.conflict("An account with this email already exists");

  // No mail system in this deployment: generate a temporary password and
  // return it once so the owner can hand it to the new team member.
  const temporaryPassword = data.password || randomCode(10);
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await User.create({
    name: data.name || nameFromEmail(email),
    email,
    phone: data.phone,
    passwordHash,
    role: "SUPER_ADMIN", // tenant membership (not role) distinguishes access; see requireSuperAdmin
    status: "ACTIVE",
    tenantId: req.tenantId,
  });

  try {
    const membership = await TenantUser.create({ tenantId: req.tenantId, userId: user._id, roleId: role._id });
    const member = {
      id: String(membership._id),
      userId: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      status: user.status,
      isActive: true,
      role: { id: String(role._id), name: role.name, slug: role.slug },
    };
    return apiSuccess(res, { member, temporaryPassword }, 201);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
});

const updateMemberSchema = z.object({
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});

const updateMember = asyncHandler(async (req, res) => {
  const data = updateMemberSchema.parse(req.body);
  const membership = await TenantUser.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate("role", "slug");
  if (!membership) throw ApiError.notFound("Team member not found");

  const currentSlug = membership.role ? membership.role.slug : null;
  const isSelf = String(membership.userId) === String(req.user.userId);

  if (data.roleId && data.roleId !== String(membership.roleId)) {
    const role = await TenantRole.findOne({ _id: data.roleId, tenantId: req.tenantId });
    if (!role) throw ApiError.badRequest("Invalid role for this tenant");
    if (role.slug === "owner" && !isOwner(req)) throw ApiError.forbidden("Only an owner can assign the Owner role");
    // Never leave the tenant without an active owner.
    if (currentSlug === "owner" && role.slug !== "owner" && (await activeOwnerCount(req.tenantId)) <= 1) {
      throw ApiError.badRequest("The tenant must keep at least one owner");
    }
    membership.roleId = role._id;
  }

  if (data.isActive !== undefined && data.isActive !== membership.isActive) {
    if (!data.isActive && currentSlug === "owner" && (await activeOwnerCount(req.tenantId)) <= 1) {
      throw ApiError.badRequest("The tenant must keep at least one active owner");
    }
    if (!data.isActive && isSelf) throw ApiError.badRequest("You cannot deactivate your own account");
    membership.isActive = data.isActive;
  }

  await membership.save();

  const userUpdate = {};
  if (data.name) userUpdate.name = data.name;
  if (data.password) userUpdate.passwordHash = await hashPassword(data.password);
  if (Object.keys(userUpdate).length) await User.updateOne({ _id: membership.userId }, { $set: userUpdate });

  const fresh = await TenantUser.findById(membership._id)
    .populate("userId", "name email phone status lastLoginAt createdAt")
    .populate("role", "name slug")
    .lean();
  return apiSuccess(res, { member: shapeMember(fresh) });
});

const deleteMember = asyncHandler(async (req, res) => {
  const membership = await TenantUser.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate("role", "slug");
  if (!membership) throw ApiError.notFound("Team member not found");

  const isSelf = String(membership.userId) === String(req.user.userId);
  if (isSelf) throw ApiError.badRequest("You cannot remove your own account");
  if (membership.role && membership.role.slug === "owner" && (await activeOwnerCount(req.tenantId)) <= 1) {
    throw ApiError.badRequest("The tenant must keep at least one owner");
  }

  const userId = membership.userId;
  await TenantUser.deleteOne({ _id: membership._id });
  // A user belongs to a single tenant, so remove the now-orphaned account too.
  await User.deleteOne({ _id: userId });
  return apiSuccess(res, { success: true });
});

// ── Roles ────────────────────────────────────────────────
const listRoles = asyncHandler(async (req, res) => {
  const roles = await TenantRole.find({ tenantId: req.tenantId }).sort({ isSystem: -1, name: 1 }).lean();
  const counts = await TenantUser.aggregate([
    { $match: { tenantId: req.tenant._id } },
    { $group: { _id: "$roleId", n: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  return apiSuccess(res, {
    roles: roles.map((r) => ({
      id: String(r._id),
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      permissions: r.permissions || [],
      memberCount: countMap.get(String(r._id)) || 0,
      editable: r.slug !== "owner",
    })),
  });
});

const createRoleSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string()).default([]),
});

const createRole = asyncHandler(async (req, res) => {
  const data = createRoleSchema.parse(req.body);
  const slug = slugifyRole(data.name);
  if (!slug) throw ApiError.badRequest("Role name is invalid");
  if (await TenantRole.exists({ tenantId: req.tenantId, slug })) throw ApiError.conflict("A role with this name already exists");
  const role = await TenantRole.create({ tenantId: req.tenantId, name: data.name, slug, permissions: data.permissions, isSystem: false });
  return apiSuccess(res, { role }, 201);
});

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  permissions: z.array(z.string()).optional(),
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await TenantRole.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.slug === "owner") throw ApiError.badRequest("The Owner role cannot be modified");

  const data = updateRoleSchema.parse(req.body);
  if (data.name) role.name = data.name;
  if (data.permissions) role.permissions = data.permissions;
  await role.save();
  return apiSuccess(res, { role });
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await TenantRole.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.badRequest("System roles cannot be deleted");
  if (await TenantUser.exists({ tenantId: req.tenantId, roleId: role._id })) {
    throw ApiError.badRequest("Reassign members using this role before deleting it");
  }
  await TenantRole.deleteOne({ _id: role._id });
  return apiSuccess(res, { success: true });
});

// ── Permission catalog ───────────────────────────────────
const permissionCatalog = asyncHandler(async (req, res) => {
  return apiSuccess(res, { groups: permissionGroupsFor(req.tenant.industry) });
});

module.exports = {
  listMembers, createMember, updateMember, deleteMember,
  listRoles, createRole, updateRole, deleteRole,
  permissionCatalog,
};
