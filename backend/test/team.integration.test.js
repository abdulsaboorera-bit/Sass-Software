"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");

const { Tenant, User, TenantUser, TenantRole } = require("../src/models");
const { rolesForIndustry } = require("../src/seed/roles");
const ctrl = require("../src/controllers/team.controller");
const { hashPassword } = require("../src/utils/password");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_team_test";
let databaseAvailable = false;
let tenant;
let owner;
let ownerMembership;

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => ((res.body = data), res);
  return res;
}

/** Invoke an asyncHandler-wrapped controller and capture the outcome. */
async function call(handler, req) {
  const res = mockRes();
  let err = null;
  await handler(req, res, (e) => (err = e));
  return { res, err };
}

function makeReq({ user = owner, permissions = ["*"], params = {}, query = {}, body = {} } = {}) {
  return {
    tenantId: String(tenant._id),
    tenant: { _id: tenant._id, industry: tenant.industry, status: tenant.status },
    user: { userId: String(user._id) },
    permissions,
    params,
    query,
    body,
  };
}

const permSlugs = (industry) => rolesForIndustry(industry).map((r) => ({ slug: r.slug, permissions: r.permissions }));
const permsOf = (industry, slug) => permSlugs(industry).find((r) => r.slug === slug).permissions;
const has = (list, p) => list.includes(p) || list.includes(`${p.split(".")[0]}.*`) || list.includes("*");

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;
    tenant = await Tenant.create({ slug: `team-${Date.now()}`, name: "Team Test Co", industry: "GYM" });
    const roles = await TenantRole.insertMany(rolesForIndustry("GYM").map((r) => ({ tenantId: tenant._id, ...r })));
    const ownerRole = roles.find((r) => r.slug === "owner");
    owner = await User.create({
      name: "Owner User",
      email: `owner-${Date.now()}@team.test`,
      passwordHash: await hashPassword("password123"),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId: tenant._id,
    });
    ownerMembership = await TenantUser.create({ tenantId: tenant._id, userId: owner._id, roleId: ownerRole._id });
  } catch {
    databaseAvailable = false;
  }
});

after(async () => {
  if (databaseAvailable) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

test("least-privilege presets withhold finance/PII from operational roles", (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");

  const gymManager = permsOf("GYM", "gym-manager");
  assert.ok(!has(gymManager, "billing.view"), "gym manager must not see billing");
  assert.ok(!has(gymManager, "expenses.view"), "gym manager must not see expenses");
  assert.ok(!has(gymManager, "salaries.view"), "gym manager must not see salaries");
  assert.ok(has(gymManager, "members.view") && has(gymManager, "attendance.mark"), "gym manager runs the floor");

  const teacher = permsOf("SCHOOL", "school-teacher");
  assert.ok(has(teacher, "assignments.create") && has(teacher, "attendance.mark"));
  assert.ok(!has(teacher, "fees.view"), "teacher must not see fees");
  assert.ok(!has(teacher, "salaries.view"), "teacher must not see payroll");

  const schoolAdmin = permsOf("SCHOOL", "school-admin");
  assert.ok(has(schoolAdmin, "fees.view") && has(schoolAdmin, "salaries.view"), "school admin sees everything");
});

test("createMember adds a role-scoped member and listMembers finds them", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const roles = await TenantRole.find({ tenantId: tenant._id }).lean();
  const receptionist = roles.find((r) => r.slug === "gym-receptionist");

  const created = await call(ctrl.createMember, makeReq({
    body: { name: "Front Desk", email: `desk-${Date.now()}@team.test`, roleId: String(receptionist._id) },
  }));
  assert.equal(created.err, null);
  assert.equal(created.res.statusCode, 201);
  assert.equal(created.res.body.member.role.slug, "gym-receptionist");
  assert.ok(created.res.body.temporaryPassword, "a temporary password is returned");

  const listed = await call(ctrl.listMembers, makeReq());
  assert.equal(listed.err, null);
  assert.ok(listed.res.body.members.some((m) => m.email === created.res.body.member.email));

  const searched = await call(ctrl.listMembers, makeReq({ query: { search: "front desk" } }));
  assert.equal(searched.res.body.members.length, 1);
});

test("a non-owner cannot assign the Owner role", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const ownerRole = await TenantRole.findOne({ tenantId: tenant._id, slug: "owner" }).lean();
  const result = await call(ctrl.createMember, makeReq({
    permissions: ["settings.manage"],
    body: { name: "Wannabe", email: `wannabe-${Date.now()}@team.test`, roleId: String(ownerRole._id) },
  }));
  assert.ok(result.err, "expected an error");
  assert.equal(result.err.status, 403);
});

test("the tenant cannot be left without an owner", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const roles = await TenantRole.find({ tenantId: tenant._id }).lean();
  const receptionist = roles.find((r) => r.slug === "gym-receptionist");
  const result = await call(ctrl.updateMember, makeReq({
    params: { id: String(ownerMembership._id) },
    body: { roleId: String(receptionist._id) },
  }));
  assert.ok(result.err, "expected an error");
  assert.equal(result.err.status, 400);
});

test("custom roles can be created, listed and deleted; system roles cannot", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const created = await call(ctrl.createRole, makeReq({
    body: { name: "Shift Lead", permissions: ["members.view", "attendance.view"] },
  }));
  assert.equal(created.err, null);
  assert.equal(created.res.statusCode, 201);
  const roleId = created.res.body.role.id;

  const listed = await call(ctrl.listRoles, makeReq());
  assert.ok(listed.res.body.roles.some((r) => r.name === "Shift Lead"));
  const ownerRow = listed.res.body.roles.find((r) => r.slug === "owner");
  assert.equal(ownerRow.editable, false);

  const firstSystem = listed.res.body.roles.find((r) => r.isSystem && r.slug !== "owner");
  const delSystem = await call(ctrl.deleteRole, makeReq({ params: { id: firstSystem.id } }));
  assert.equal(delSystem.err.status, 400);

  const delCustom = await call(ctrl.deleteRole, makeReq({ params: { id: roleId } }));
  assert.equal(delCustom.err, null);
});
