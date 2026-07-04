"use strict";

const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { TenantUser } = require("../models");

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
const requireAuth = (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  next();
};

/** Require platform super admin (tenant-independent). */
const requireSuperAdmin = (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "SUPER_ADMIN") throw ApiError.forbidden();
  next();
};

/**
 * Require the caller to be operating inside a tenant. Sets req.tenantId.
 * Super admins may act on any tenant by passing `?tenantId=` / `x-tenant-id`.
 */
const requireTenant = (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();

  let tenantId = req.user.tenantId;
  if (!tenantId && req.user.role === "SUPER_ADMIN") {
    tenantId = req.query.tenantId || req.headers["x-tenant-id"];
  }
  if (!tenantId) throw ApiError.forbidden("No tenant context");

  req.tenantId = String(tenantId);
  next();
};

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
  loadMembership,
};
