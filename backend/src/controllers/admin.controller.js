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

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  industry: z.enum(["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP"]),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
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
  const id = req.body.id || req.params.id;
  if (!id) throw ApiError.badRequest("id is required");
  const { id: _omit, ...updates } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(id, updates, { new: true });
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
    User.find(filter).populate("tenantId", "name slug industry").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  // Expose tenant alias (users page reads user.tenant).
  const shaped = users.map(({ tenantId, ...u }) => ({ ...u, tenant: tenantId || null }));
  return apiSuccess(res, { users: shaped, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "SUPPORT_AGENT"]).optional(),
  tenantId: z.string().optional(),
});

const createUser = asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);
  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role || "SUPPORT_AGENT",
    status: "ACTIVE",
    tenantId: data.tenantId || null,
  });
  return apiSuccess(res, { user }, 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const id = req.body.id || req.params.id;
  if (!id) throw ApiError.badRequest("id is required");
  const { id: _omit, password, ...updates } = req.body;
  if (password) updates.passwordHash = await hashPassword(password);
  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return apiSuccess(res, { user });
});

module.exports = { listTenants, createTenant, updateTenant, listUsers, createUser, updateUser };
