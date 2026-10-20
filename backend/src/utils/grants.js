"use strict";

/**
 * Grant/assignment rules for the tenant role editor.
 *
 * Shared by team.controller.js and the roles contract test so the invariants
 * ("you cannot hand out access you do not hold yourself") have exactly one
 * implementation. Wildcards ("students.*", "settings.*") are first-class:
 * seeded presets use them and operators must be able to save those roles.
 */

const { permissionGroupsFor } = require("../seed/roles");
const { permits } = require("../middleware/rbac");
const { ApiError } = require("./apiResponse");

/** Concrete permission keys only ("students.view"); wildcards are handled separately. */
const PERMISSION_PATTERN = /^[a-z0-9_-]+(\.[a-z0-9_-]+){1,2}$/i;

/** Only an Owner (the "*" wildcard permission) may grant/revoke ownership. */
function isOwner(req) {
  // Platform super admins acting cross-tenant have unrestricted rights.
  if (req.user && req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return true;
  const perms = req.permissions || [];
  return perms.includes("*");
}

function catalogKeysFor(industry) {
  const keys = new Set();
  for (const group of permissionGroupsFor(industry)) {
    for (const entry of group.permissions) keys.add(entry.key);
  }
  return keys;
}

/** Is `permission` something the role editor can even offer for this industry? */
function isCatalogPermission(keys, permission) {
  if (keys.has(permission)) return true;
  if (permission.endsWith(".*")) {
    const resource = permission.slice(0, -2);
    return [...keys].some((k) => k.startsWith(`${resource}.`));
  }
  const parts = permission.split(".");
  return parts.length === 3 && keys.has(`${parts[0]}.${parts[1]}`);
}

/**
 * Does the granter's permission set cover `permission`?
 * A wildcard ("billing.*") is covered by holding every catalogued action for
 * that resource, so a manager holding billing.view/create/edit can still
 * assign a role that asks for billing.*.
 */
function holdsPermission(granter, permission, keys) {
  if (permits(granter, permission)) return true;
  if (!permission.endsWith(".*")) return false;
  const resource = permission.slice(0, -2);
  const resourceKeys = [...keys].filter((k) => k.startsWith(`${resource}.`));
  return resourceKeys.length > 0 && resourceKeys.every((k) => permits(granter, k));
}

/**
 * Filter a requested permission list down to what this caller may grant.
 * - already-granted permissions are always preserved (lets admins REMOVE
 *   access they themselves lack, e.g. revoking billing from a role);
 * - new permissions must be in the industry catalog and held by the granter;
 * - "*" and "resource.*" are owner/granter-checked the same way.
 */
function normalizeGrantablePermissions(req, requested, existing = []) {
  const granter = req.permissions || [];
  const keys = catalogKeysFor(req.tenant.industry);
  const owner = isOwner(req);
  const alreadyGranted = new Set((existing || []).map((p) => String(p)));
  const seen = new Set();
  const result = [];

  for (const raw of requested || []) {
    const permission = String(raw || "").trim();
    if (!permission || seen.has(permission)) continue;
    seen.add(permission);

    if (permission === "*") {
      if (!owner) throw ApiError.forbidden("Only an owner can grant full access");
      result.push(permission);
      continue;
    }

    if (permission.endsWith(".*")) {
      const resource = permission.slice(0, -2);
      if (!resource || resource.includes(".")) throw ApiError.badRequest(`Invalid permission "${permission}"`);
      if (alreadyGranted.has(permission)) {
        result.push(permission);
        continue;
      }
      if (!isCatalogPermission(keys, permission)) continue;
      if (!owner && !holdsPermission(granter, permission, keys)) {
        throw ApiError.forbidden(`You cannot grant "${permission}" because you do not have it`);
      }
      result.push(permission);
      continue;
    }

    if (!PERMISSION_PATTERN.test(permission)) throw ApiError.badRequest(`Invalid permission "${permission}"`);
    if (alreadyGranted.has(permission)) {
      result.push(permission);
      continue;
    }
    if (!isCatalogPermission(keys, permission)) continue;
    if (!owner && !holdsPermission(granter, permission, keys)) {
      throw ApiError.forbidden(`You cannot grant "${permission}" because you do not have it`);
    }
    result.push(permission);
  }

  return result;
}

/**
 * Role ASSIGNMENT (hiring): a settings-manager may hand out any pre-existing
 * non-owner role, even one carrying permissions they do not hold — the owner
 * seeded that preset and trusted the manager with team administration. The
 * escalation paths that stay closed are full-access ("*") roles and, for
 * self-service changes, anything the account does not already hold
 * (see assertHoldsEveryPermission).
 */
function assertCanAssignRole(req, role) {
  if (isOwner(req)) return;
  if ((role.permissions || []).includes("*")) {
    throw ApiError.forbidden("Only an owner can assign a role with full access");
  }
}

/** Changing your OWN role still requires holding every permission it carries. */
function assertHoldsEveryPermission(req, role) {
  if (isOwner(req)) return;
  const granter = req.permissions || [];
  const keys = catalogKeysFor(req.tenant.industry);
  for (const permission of role.permissions || []) {
    if (!holdsPermission(granter, permission, keys)) {
      throw ApiError.forbidden(`You cannot give your own account the "${permission}" permission`);
    }
  }
}

module.exports = {
  PERMISSION_PATTERN,
  isOwner,
  catalogKeysFor,
  isCatalogPermission,
  holdsPermission,
  normalizeGrantablePermissions,
  assertCanAssignRole,
  assertHoldsEveryPermission,
};
