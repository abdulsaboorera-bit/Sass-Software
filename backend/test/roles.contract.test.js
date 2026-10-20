"use strict";

/**
 * Per-industry invariants for the roles & members system. These lock in the
 * guarantees the Team & Roles screen depends on, for every solution vertical:
 *   1. every permission a route enforces is offered by that industry's catalog
 *      (so it is grantable and visible in the role editor);
 *   2. every preset role permission is visible in its industry catalog;
 *   3. saving a preset role never 400s — wildcards ("students.*") included;
 *   4. an industry's settings-manager can hire every preset role except Owner.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const roles = require("../src/seed/roles");
const {
  catalogKeysFor,
  isCatalogPermission,
  normalizeGrantablePermissions,
  assertCanAssignRole,
  assertHoldsEveryPermission,
} = require("../src/utils/grants");

const ROUTES_DIR = path.join(__dirname, "..", "src", "routes");
const DIR_TO_INDUSTRY = {
  gym: "GYM",
  school: "SCHOOL",
  clinic: "CLINIC",
  restaurant: "RESTAURANT",
  bookshop: "BOOKSHOP",
  carRental: "CAR_RENTAL",
  realEstate: "REAL_ESTATE",
  salon: "SALON",
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function industryForFile(file) {
  const rel = path.relative(ROUTES_DIR, file).replace(/\\/g, "/");
  for (const seg of rel.split("/")) {
    for (const [key, industry] of Object.entries(DIR_TO_INDUSTRY)) {
      if (seg === key || seg.startsWith(`${key}.`)) return industry;
    }
  }
  return null; // mounted for every industry
}

/** Permission keys referenced by route guards (requirePermission / requireAnyPermission / crud `permission:`). */
function enforcedRouteKeys() {
  const perIndustry = new Map();
  for (const file of walk(ROUTES_DIR)) {
    const src = fs.readFileSync(file, "utf8");
    const bucket = industryForFile(file);
    const add = (key) => {
      if (!perIndustry.has(bucket)) perIndustry.set(bucket, new Set());
      perIndustry.get(bucket).add(key);
    };
    for (const m of src.matchAll(/requirePermission\(\s*["'`]([A-Za-z0-9_.-]+)["'`]/g)) add(m[1]);
    for (const m of src.matchAll(/requireAnyPermission\(([^)]*)\)/g)) {
      for (const p of m[1].matchAll(/["'`]([A-Za-z0-9_.-]+)["'`]/g)) add(p[1]);
    }
    for (const m of src.matchAll(/permission:\s*["'`]([A-Za-z0-9_.-]+)["'`]/g)) {
      // makeCrudRouter guards <resource>.view / .create / .edit (delete reuses edit).
      add(m[1]);
      add(`${m[1]}.view`);
      add(`${m[1]}.create`);
      add(`${m[1]}.edit`);
    }
  }
  return perIndustry;
}

function fakeReq(industry, permissions) {
  return { permissions, tenant: { industry }, tenantId: "contract-test", user: { role: "USER", tenantId: "contract-test" } };
}

test("every route-enforced permission is in its industry's catalog", () => {
  const enforced = enforcedRouteKeys();
  for (const industry of roles.INDUSTRIES) {
    const keys = catalogKeysFor(industry);
    const used = new Set([...(enforced.get(null) || []), ...(enforced.get(industry) || [])]);
    for (const permission of used) {
      // crud routers use the bare resource ("students") which maps to that
      // resource's group; everything else must be a catalogued action key.
      const grantable = isCatalogPermission(keys, permission) ||
        (!permission.includes(".") && [...keys].some((k) => k.startsWith(`${permission}.`)));
      assert.ok(grantable, `${industry} catalog must cover route permission "${permission}"`);
    }
  }
});

test("every preset role permission is visible in its industry's catalog", () => {
  for (const industry of roles.INDUSTRIES) {
    const keys = catalogKeysFor(industry);
    for (const role of roles.rolesForIndustry(industry)) {
      if (role.slug === "owner") continue; // "*" is owner-only and not a chip
      for (const permission of role.permissions) {
        assert.ok(
          isCatalogPermission(keys, permission),
          `${industry} / ${role.name}: "${permission}" must appear in the ${industry} permission catalog`
        );
      }
    }
  }
});

test("saving any preset role succeeds for owners and settings-managers", () => {
  for (const industry of roles.INDUSTRIES) {
    const owners = fakeReq(industry, ["*"]);
    const manager = fakeReq(industry, ["settings.*", "settings.manage"]);
    for (const role of roles.rolesForIndustry(industry)) {
      if (role.slug === "owner") continue; // non-owners may not touch the Owner role
      assert.doesNotThrow(
        () => normalizeGrantablePermissions(owners, role.permissions, role.permissions),
        `${industry} / ${role.name} must be savable by an owner`
      );
      assert.doesNotThrow(
        () => normalizeGrantablePermissions(manager, role.permissions, role.permissions),
        `${industry} / ${role.name} must be savable by a settings-manager`
      );
    }
  }
});

test("a settings-manager can hire every preset role except Owner", () => {
  for (const industry of roles.INDUSTRIES) {
    const defs = roles.rolesForIndustry(industry);
    const managers = defs.filter((r) => r.permissions.includes("settings.*") || r.permissions.includes("settings.manage"));
    assert.ok(managers.length > 0, `${industry} needs at least one preset that can reach Team & Roles`);
    for (const manager of managers) {
      for (const role of defs) {
        const req = fakeReq(industry, manager.permissions);
        if (role.slug === "owner") {
          assert.throws(() => assertCanAssignRole(req, role), /Owner|full access/i);
          continue;
        }
        assert.doesNotThrow(
          () => assertCanAssignRole(req, role),
          `${industry}: ${manager.name} must be able to assign ${role.name}`
        );
      }
    }
  }
});

test("a settings-only admin cannot promote their own account beyond what they hold", () => {
  for (const industry of roles.INDUSTRIES) {
    // Narrow caller: reaches Team & Roles via settings.* but holds nothing else.
    const narrow = fakeReq(industry, ["settings.*", "settings.manage"]);
    for (const role of roles.rolesForIndustry(industry)) {
      if (role.slug === "owner") continue;
      if (!role.permissions.some((p) => !p.startsWith("settings."))) continue;
      assert.throws(
        () => assertHoldsEveryPermission(narrow, role),
        undefined,
        `${industry}: a settings-only admin must not be able to self-promote into ${role.name}`
      );
      assert.doesNotThrow(
        () => assertHoldsEveryPermission(fakeReq(industry, ["*"]), role),
        `${industry}: an owner may take any role`
      );
    }
  }
});

test("full access stays owner-only", () => {
  for (const industry of roles.INDUSTRIES) {
    const manager = fakeReq(industry, ["settings.*", "settings.manage"]);
    assert.throws(
      () => normalizeGrantablePermissions(manager, ["*"], []),
      /owner/i,
      `${industry}: a settings-manager must not be able to grant "*"`
    );
  }
});
