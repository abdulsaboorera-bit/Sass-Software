"use strict";

const { z } = require("zod");
const { Tenant, User, TenantUser, TenantRole } = require("../models");
const { apiSuccess, ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { paginate } = require("../utils/query");
const { hashPassword } = require("../utils/password");
const { SYSTEM_ROLES } = require("../seed/roles");

// ── Tenants ──────────────────────────────────────────────
const listTenants = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { slug: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.industry) filter.industry = req.query.industry;
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Tenant.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Tenant.countDocuments(filter),
  ]);

  // Attach _count.users (frontend reads t._count.users).
  const counts = await TenantUser.aggregate([
    { $match: { tenantId: { $in: rows.map((r) => r._id) } } },
    { $group: { _id: "$tenantId", n: { $addToSet: "$userId" } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n.length]));
  const tenants = rows.map((t) => ({ ...t, _count: { users: map.get(String(t._id)) || 0 } }));

  return apiSuccess(res, { tenants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listRoles = asyncHandler(async (req, res) => {
  if (!req.query.tenantId) throw ApiError.badRequest("tenantId is required");
  const roles = await TenantRole.find({ tenantId: req.query.tenantId }).sort({ name: 1 }).lean();
  return apiSuccess(res, { roles });
});

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  industry: z.enum(["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP", "CAR_RENTAL"]),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
});

const updateTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  industry: z.enum(["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP", "CAR_RENTAL"]).optional(),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]).optional(),
  trialEndsAt: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  logo: z.string().optional(),
});

const createTenant = asyncHandler(async (req, res) => {
  const data = createTenantSchema.parse(req.body);
  const exists = await Tenant.findOne({ slug: data.slug });
  if (exists) throw ApiError.conflict("A tenant with this slug already exists");

  const tenant = await Tenant.create({ ...data, plan: data.plan || "TRIAL", status: "ACTIVE" });
  // Seed the three system roles so the tenant is immediately usable.
  await TenantRole.insertMany(SYSTEM_ROLES.map((r) => ({ tenantId: tenant._id, ...r })));
  return apiSuccess(res, { tenant }, 201);
});

const updateTenant = asyncHandler(async (req, res) => {
  const data = updateTenantSchema.parse({ ...req.body, id: req.body.id || req.params.id });
  const { id, ...updates } = data;
  if (updates.trialEndsAt) updates.trialEndsAt = new Date(updates.trialEndsAt);
  const tenant = await Tenant.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!tenant) throw ApiError.notFound("Tenant not found");
  return apiSuccess(res, { tenant });
});

// ── Users ────────────────────────────────────────────────
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;

  const [users, total] = await Promise.all([
    User.find(filter).select("-passwordHash").populate("tenantId", "name slug industry").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  // Expose tenant alias (users page reads user.tenant).
  const shaped = users.map(({ tenantId, ...u }) => ({ ...u, tenant: tenantId || null }));
  return apiSuccess(res, { users: shaped, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/**
 * A user belongs to at most one tenant. Reconcile their TenantUser
 * membership to match `tenantId`: clear any existing membership, and if a
 * tenant is given, attach them to its `owner` role. This is what makes
 * "add/move a user to a tenant" actually functional — every permission
 * check goes through TenantUser + TenantRole, not User.tenantId.
 */
async function syncTenantMembership(userId, tenantId, roleId) {
  await TenantUser.deleteMany({ userId });
  if (!tenantId) return;

  const role = roleId
    ? await TenantRole.findOne({ _id: roleId, tenantId })
    : await TenantRole.findOne({ tenantId, slug: "owner" });
  if (!role) throw ApiError.badRequest("Invalid tenant role");
  await TenantUser.create({ tenantId, userId, roleId: role._id });
}

const createUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN"]).optional(),
  tenantId: z.string().optional(),
  roleId: z.string().optional(),
});

/** "gym2@demo.com" -> "Gym2" — used when no display name is given at creation. */
function nameFromEmail(email) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

const createUser = asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);

  if (data.tenantId) {
    const tenant = await Tenant.findById(data.tenantId);
    if (!tenant) throw ApiError.badRequest("Invalid tenant");
    if (data.roleId && !(await TenantRole.exists({ _id: data.roleId, tenantId: data.tenantId }))) throw ApiError.badRequest("Invalid tenant role");
  } else if (data.roleId) {
    throw ApiError.badRequest("A tenant role requires a tenant");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    name: data.name || nameFromEmail(data.email),
    email: data.email.toLowerCase(),
    passwordHash,
    role: "SUPER_ADMIN", // tenant ownership vs. platform admin is distinguished by tenantId, not role
    status: "ACTIVE",
    tenantId: data.tenantId || null,
  });

  if (data.tenantId) await syncTenantMembership(user._id, data.tenantId, data.roleId);

  return apiSuccess(res, { user }, 201);
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  tenantId: z.string().nullable().optional(),
  roleId: z.string().optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
});

const updateUser = asyncHandler(async (req, res) => {
  const data = updateUserSchema.parse({ ...req.body, id: req.body.id || req.params.id });
  const { id, password, tenantId, roleId, ...updates } = data;
  if (updates.email) updates.email = updates.email.toLowerCase();
  if (password) updates.passwordHash = await hashPassword(password);

  const tenantChanging = tenantId !== undefined;
  if (tenantChanging) {
    if (tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw ApiError.badRequest("Invalid tenant");
    }
    updates.tenantId = tenantId || null;
  }
  if (roleId) {
    const targetTenantId = tenantChanging ? tenantId : (await User.findById(id).select("tenantId").lean())?.tenantId;
    if (!targetTenantId || !(await TenantRole.exists({ _id: roleId, tenantId: targetTenantId }))) throw ApiError.badRequest("Invalid tenant role");
  }

  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  if (!user) throw ApiError.notFound("User not found");

  if (tenantChanging || roleId) await syncTenantMembership(user._id, tenantId !== undefined ? tenantId || null : user.tenantId, roleId);

  return apiSuccess(res, { user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const id = req.body.id || req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound("User not found");
  await TenantUser.deleteMany({ userId: id });
  return apiSuccess(res, { success: true });
});

module.exports = { listTenants, listRoles, createTenant, updateTenant, listUsers, createUser, updateUser, deleteUser };
