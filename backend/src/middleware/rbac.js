"use strict";

const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { loadMembership } = require("./auth");

/**
 * Does a permissions array grant `permission`?
 * "*" is a wildcard super-permission; "members.*" grants any members.* action.
 * Scoped permissions such as "members.view.assigned" intentionally do not
 * grant the broader "members.view" permission.
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
 * first. Platform super admins (role SUPER_ADMIN, no tenant of their own)
 * acting on a tenant they don't belong to are allowed through.
 *
 * Tenant owners are *also* stored with role "SUPER_ADMIN" (that's how tenant
 * ownership is modeled) — the `!req.user.tenantId` check is what stops a
 * tenant owner whose membership was removed/reassigned from still being
 * treated as a platform admin with blanket access to their old tenant.
 */
function requirePermission(permission) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    const membership = await loadMembership(req);

    if (!membership) {
      if (req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return next();
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
      if (req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return next();
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
