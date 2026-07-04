"use strict";

const { User, Tenant, TenantUser } = require("../models");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/me — reproduces the old Next.js /api/me contract the dashboard reads:
 *   { user: { user: {...fields}, tenant, tenantRole, permissions } }
 */
const me = asyncHandler(async (req, res) => {
  const u = await User.findById(req.user.userId).lean();
  if (!u) return apiSuccess(res, { user: null });

  const userFields = {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };

  let tenant = null;
  let tenantRole = null;
  let permissions = [];

  if (u.tenantId) {
    const t = await Tenant.findById(u.tenantId).lean();
    if (t) {
      tenant = {
        id: String(t._id),
        slug: t.slug,
        name: t.name,
        industry: t.industry,
        plan: t.plan,
        status: t.status,
        logo: t.logo,
        timezone: t.timezone,
        currency: t.currency,
      };
    }
    const membership = await TenantUser.findOne({ tenantId: u.tenantId, userId: u._id, isActive: true })
      .populate("role")
      .populate("branchId", "name")
      .lean();
    if (membership && membership.role) {
      tenantRole = { name: membership.role.name, slug: membership.role.slug, branch: membership.branchId || null };
      permissions = membership.role.permissions || [];
    }
  }

  return apiSuccess(res, { user: { user: userFields, tenant, tenantRole, permissions } });
});

module.exports = { me };
