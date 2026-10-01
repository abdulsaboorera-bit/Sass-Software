"use strict";

const { z } = require("zod");
const authService = require("../services/auth.service");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name is required"),
  businessName: z.string().min(2, "Business name is required"),
  industry: z.enum(["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP", "CAR_RENTAL", "REAL_ESTATE"]),
  phone: z.string().optional(),
});

function reqMeta(req) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress:
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.ip,
  };
}

const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login({ ...data, ...reqMeta(req) });
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  return apiSuccess(res, { user: result.user, tenant: result.tenant });
});

const signup = asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const result = await authService.signup({ ...data, ...reqMeta(req) });
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  return apiSuccess(res, { user: result.user, tenant: result.tenant }, 201);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refresh_token;
  const result = await authService.refresh({ refreshToken: token, ...reqMeta(req) });
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  return apiSuccess(res, { success: true });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refresh_token;
  await authService.logout(token);
  clearAuthCookies(res);
  return apiSuccess(res, { success: true });
});

/** Current user + tenant memberships + effective permissions. */
const me = asyncHandler(async (req, res) => {
  const { User, Tenant, TenantUser } = require("../models");
  const user = await User.findById(req.user.userId).select("-passwordHash").lean();
  if (!user) return apiSuccess(res, { user: null });

  const tenant = user.tenantId ? await Tenant.findById(user.tenantId).lean() : null;

  let permissions = [];
  let roleSlug = null;
  if (user.tenantId) {
    const membership = await TenantUser.findOne({
      tenantId: user.tenantId,
      userId: user._id,
      isActive: true,
    })
      .populate("role")
      .lean();
    if (membership && membership.role) {
      permissions = membership.role.permissions || [];
      roleSlug = membership.role.slug;
    }
  }

  return apiSuccess(res, {
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    tenant: tenant
      ? { id: String(tenant._id), slug: tenant.slug, name: tenant.name, industry: tenant.industry }
      : null,
    roleSlug,
    permissions,
  });
});

module.exports = { login, signup, refresh, logout, me };
