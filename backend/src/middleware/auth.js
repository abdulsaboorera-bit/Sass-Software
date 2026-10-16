"use strict";

const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { Tenant, TenantUser, User } = require("../models");

/**
 * Tiny in-process cache for the per-request User lookup. This runs on every
 * authenticated request, so a short TTL trades a few seconds of staleness
 * (e.g. a just-suspended account) for skipping a DB round-trip on the hot path.
 */
const USER_CACHE_TTL_MS = 5_000;
const USER_CACHE_MAX = 2_000;
const userCache = new Map();

function cacheKeyFor(user) {
  const id = user && (user._id || user.id);
  return id ? String(id) : null;
}

/**
 * Read the access token from the httpOnly cookie (as the Next.js app sets it)
 * or an `Authorization: Bearer <token>` header (for API clients / the new
 * Express-first frontends). Attaches `req.user` (token payload) when valid.
 */
function extractToken(req) {
  const fromCookie = req.cookies && req.cookies.access_token;
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Populate req.user if a valid token is present. Never rejects. */
const attachUser = (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.user = payload;
  }
  next();
};

/** Require a valid, authenticated user. */
async function loadCurrentUser(req) {
  if (req.currentUser !== undefined) return req.currentUser;

  const userId = req.user && req.user.userId;

  if (userId) {
    const cached = userCache.get(String(userId));
    if (cached && Date.now() - cached.at < USER_CACHE_TTL_MS) {
      req.currentUser = cached.user;
      return req.currentUser;
    }
  }

  const user = await User.findById(userId).select("role status tenantId").lean();

  if (user) {
    if (userCache.size >= USER_CACHE_MAX) userCache.clear();
    const key = cacheKeyFor(user);
    if (key) userCache.set(key, { at: Date.now(), user });
  }

  req.currentUser = user;
  return req.currentUser;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await loadCurrentUser(req);
  if (!user || user.status !== "ACTIVE") throw ApiError.unauthorized("Account unavailable");
  next();
});

/**
 * Require platform super admin (tenant-independent). Tenant owners are also
 * stored with role "SUPER_ADMIN" (that's how tenant ownership is modeled),
 * so this must also confirm the caller has no tenant — otherwise every
 * tenant owner would have full platform admin API access.
 */
const requireSuperAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await loadCurrentUser(req);
  if (!user || user.status !== "ACTIVE" || user.role !== "SUPER_ADMIN" || user.tenantId) throw ApiError.forbidden();
  next();
});

/**
 * Require the caller to be operating inside a tenant. Sets req.tenantId.
 * Super admins may act on any tenant by passing `?tenantId=` / `x-tenant-id`.
 */
const requireTenant = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();

  const user = await loadCurrentUser(req);
  let tenantId = user && user.tenantId;
  if (!tenantId && user && user.role === "SUPER_ADMIN") {
    tenantId = req.query.tenantId || req.headers["x-tenant-id"];
  }
  if (!tenantId) throw ApiError.forbidden("No tenant context");

  req.tenantId = String(tenantId);
  const tenant = await Tenant.findById(req.tenantId).select("_id industry status").lean();
  if (!tenant) throw ApiError.forbidden("Tenant not found");
  if (!["ACTIVE", "TRIAL"].includes(tenant.status)) throw ApiError.forbidden("Tenant is not active");
  req.tenant = tenant;
  next();
});

/** Require a tenant to belong to a specific vertical before serving its APIs. */
const requireIndustry = (industry) => asyncHandler(async (req, _res, next) => {
  if (!req.tenantId) throw ApiError.forbidden("No tenant context");
  const tenant = req.tenant || await Tenant.findOne({ _id: req.tenantId }).select("_id industry status").lean();
  if (!tenant) throw ApiError.forbidden(`This tenant does not use the ${industry.toLowerCase()} module`);
  if (tenant.industry !== industry) throw ApiError.forbidden(`This tenant does not use the ${industry.toLowerCase()} module`);
  if (["SUSPENDED", "CANCELLED"].includes(tenant.status)) throw ApiError.forbidden("Tenant is not active");
  req.tenant = tenant;
  next();
});

/**
 * Load the caller's TenantUser membership (with role) for the current tenant
 * and attach it as req.membership. Cached on the request. Returns null for
 * super admins acting outside their own tenant (they bypass permission checks).
 */
async function loadMembership(req) {
  if (req.membership !== undefined) return req.membership;

  const membership = await TenantUser.findOne({
    tenantId: req.tenantId,
    userId: req.user.userId,
    isActive: true,
  })
    .populate("role")
    .lean();

  req.membership = membership || null;
  return req.membership;
}

module.exports = {
  extractToken,
  attachUser,
  requireAuth,
  requireSuperAdmin,
  requireTenant,
  requireIndustry,
  loadMembership,
};
