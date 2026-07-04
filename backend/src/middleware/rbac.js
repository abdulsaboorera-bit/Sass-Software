"use strict";

const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { loadMembership } = require("./auth");

/**
 * Does a permissions array grant `permission`?
 * "*" is a wildcard super-permission; "members.*" grants any members.* action.
 */
function permits(permissions, permission) {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*") || permissions.includes(permission)) return true;
  const resource = permission.split(".")[0];
  return permissions.includes(`${resource}.*`);
}

/**
 * Require a specific permission string (e.g. "members.create") within the
 * current tenant. Composes with requireAuth + requireTenant which must run
 * first. Super admins acting on a tenant they don't belong to are allowed
 * through (platform-level override), matching the previous behaviour.
 */
function requirePermission(permission) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    const membership = await loadMembership(req);

    // Platform super admin with no tenant membership => full access.
    if (!membership) {
      if (req.user.role === "SUPER_ADMIN") return next();
      throw ApiError.forbidden();
    }

    const perms = membership.role ? membership.role.permissions : [];
    if (!permits(perms, permission)) throw ApiError.forbidden();

    // Expose the granted permission set + role for downstream scoping.
    req.permissions = perms;
    req.roleSlug = membership.role ? membership.role.slug : null;
    next();
  });
}

/**
 * Require ANY of the listed permissions (OR semantics).
 */
function requireAnyPermission(...permissionList) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    const membership = await loadMembership(req);
    if (!membership) {
      if (req.user.role === "SUPER_ADMIN") return next();
      throw ApiError.forbidden();
    }
    const perms = membership.role ? membership.role.permissions : [];
    if (!permissionList.some((p) => permits(perms, p))) throw ApiError.forbidden();
    req.permissions = perms;
    req.roleSlug = membership.role ? membership.role.slug : null;
    next();
  });
}

module.exports = { permits, requirePermission, requireAnyPermission };
