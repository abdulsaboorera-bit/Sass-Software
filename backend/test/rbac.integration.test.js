"use strict";

process.env.NODE_ENV = "test";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");

const { Tenant, User, TenantUser, TenantRole, Patient } = require("../src/models");
const { rolesForIndustry } = require("../src/seed/roles");
const { hashPassword } = require("../src/utils/password");
const { signAccessToken } = require("../src/utils/jwt");
const app = require("../src/app");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_rbac_test";

let databaseAvailable = false;
let server;
let baseUrl;
let tenant;
let deniedRoleId;
let fullAccessRoleId;
let doctorRoleId;
let firstPatientId;
let tokens = {};
const CLINIC_DOCTOR = rolesForIndustry("CLINIC").find((r) => r.slug === "clinic-doctor").permissions;

function bearer(user) {
  return signAccessToken({ userId: String(user._id), email: user.email, role: user.role, tenantId: String(tenant._id) });
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function makeUser(email, name, role) {
  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword("password123"),
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    tenantId: tenant._id,
  });
  await TenantUser.create({ tenantId: tenant._id, userId: user._id, roleId: role._id });
  return user;
}

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({
      slug: `rbac-${Date.now()}`,
      name: "RBAC Clinic",
      industry: "CLINIC",
      plan: "PROFESSIONAL",
      status: "ACTIVE",
    });

    const roles = await TenantRole.insertMany(rolesForIndustry("CLINIC").map((r) => ({ tenantId: tenant._id, ...r })));
    const bySlug = (slug) => roles.find((r) => r.slug === slug);

    const deniedRole = await TenantRole.create({
      tenantId: tenant._id,
      name: "Doctor Without Create",
      slug: "doctor-without-create",
      permissions: CLINIC_DOCTOR.filter((p) => p !== "patients.create"),
      isSystem: false,
    });
    const managerRole = await TenantRole.create({
      tenantId: tenant._id,
      name: "Settings Admin",
      slug: "settings-admin",
      permissions: ["settings.*"],
      isSystem: false,
    });

    deniedRoleId = String(deniedRole._id);
    doctorRoleId = String(bySlug("clinic-doctor")._id);

    const owner = await makeUser("rbac-owner@clinic.test", "Clinic Owner", bySlug("owner"));
    const doctor = await makeUser("rbac-doctor@clinic.test", "Clinic Doctor", bySlug("clinic-doctor"));
    const denied = await makeUser("rbac-denied@clinic.test", "Doctor Without Create", deniedRole);
    const accountant = await makeUser("rbac-accountant@clinic.test", "Clinic Accountant", bySlug("clinic-accountant"));
    const manager = await makeUser("rbac-manager@clinic.test", "Settings Admin User", managerRole);

    tokens = {
      owner: bearer(owner),
      doctor: bearer(doctor),
      denied: bearer(denied),
      accountant: bearer(accountant),
      manager: bearer(manager),
    };

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  } catch (error) {
    databaseAvailable = false;
    console.error(error);
  }
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (databaseAvailable) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

test("a role without patients.create can still view the patient list", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const res = await api("GET", "/api/clinic/patients", { token: tokens.denied });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.patients));
});

test("POST /api/clinic/patients is 403 without patients.create and stores nothing", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const before = await Patient.countDocuments({ tenantId: tenant._id });
  const res = await api("POST", "/api/clinic/patients", {
    token: tokens.denied,
    body: { name: "Blocked Patient", phone: "03000000011" },
  });
  assert.equal(res.status, 403);
  assert.equal(res.data.error, "Permission denied");
  assert.equal(await Patient.countDocuments({ tenantId: tenant._id }), before);
});

test("a role holding patients.create registers a patient", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const res = await api("POST", "/api/clinic/patients", {
    token: tokens.doctor,
    body: { name: "Registered Patient", phone: "03000000012" },
  });
  assert.equal(res.status, 201);
  assert.ok(res.data.patient.id);
  assert.match(res.data.patient.patientNo, /^P-\d{4}$/);
  firstPatientId = res.data.patient.id;
});

test("denying patients.create on the doctor role blocks the doctor on the next request", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const denied = await api("PATCH", `/api/team/roles/${doctorRoleId}`, {
    token: tokens.owner,
    body: { permissions: CLINIC_DOCTOR.filter((p) => p !== "patients.create") },
  });
  assert.equal(denied.status, 200);

  const blocked = await api("POST", "/api/clinic/patients", {
    token: tokens.doctor,
    body: { name: "Should Be Blocked", phone: "03000000013" },
  });
  assert.equal(blocked.status, 403);

  const stillViews = await api("GET", "/api/clinic/patients", { token: tokens.doctor });
  assert.equal(stillViews.status, 200);
});

test("restoring patients.create on the doctor role allows the doctor again", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const restored = await api("PATCH", `/api/team/roles/${doctorRoleId}`, {
    token: tokens.owner,
    body: { permissions: CLINIC_DOCTOR },
  });
  assert.equal(restored.status, 200);
  assert.ok(restored.data.role.permissions.includes("patients.create"));

  const allowed = await api("POST", "/api/clinic/patients", {
    token: tokens.doctor,
    body: { name: "Re-registered Patient", phone: "03000000014" },
  });
  assert.equal(allowed.status, 201);
});

test("only an owner can create a full-access role", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const forbidden = await api("POST", "/api/team/roles", {
    token: tokens.manager,
    body: { name: "Escalated Role", permissions: ["*"] },
  });
  assert.equal(forbidden.status, 403);
  assert.equal(await TenantRole.countDocuments({ tenantId: tenant._id, slug: "escalated-role" }), 0);

  const created = await api("POST", "/api/team/roles", {
    token: tokens.owner,
    body: { name: "Full Access Backup", permissions: ["*"] },
  });
  assert.equal(created.status, 201);
  fullAccessRoleId = created.data.role.id;
});

test("a settings manager cannot grant permissions they do not hold", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const escalation = await api("POST", "/api/team/roles", {
    token: tokens.manager,
    body: { name: "Sneaky Clinical Role", permissions: ["patients.create"] },
  });
  assert.equal(escalation.status, 403);
  assert.equal(await TenantRole.countDocuments({ tenantId: tenant._id, slug: "sneaky-clinical-role" }), 0);

  const ownScope = await api("POST", "/api/team/roles", {
    token: tokens.manager,
    body: { name: "Settings Helper", permissions: ["settings.view"] },
  });
  assert.equal(ownScope.status, 201);
});

test("a settings manager cannot add a held-by-nobody permission to an existing role", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const current = await api("GET", "/api/team/roles", { token: tokens.manager });
  assert.equal(current.status, 200);
  const target = current.data.roles.find((r) => r.id === deniedRoleId);
  assert.ok(target);
  assert.equal(target.permissions.includes("patients.create"), false);

  const res = await api("PATCH", `/api/team/roles/${deniedRoleId}`, {
    token: tokens.manager,
    body: { permissions: [...target.permissions, "patients.create"] },
  });
  assert.equal(res.status, 403);

  const stillDenied = await api("POST", "/api/clinic/patients", {
    token: tokens.denied,
    body: { name: "Still Blocked", phone: "03000000015" },
  });
  assert.equal(stillDenied.status, 403);
});

test("an owner can grant patients.create and the denied doctor gains it immediately", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const target = (await api("GET", "/api/team/roles", { token: tokens.owner })).data.roles.find((r) => r.id === deniedRoleId);
  const res = await api("PATCH", `/api/team/roles/${deniedRoleId}`, {
    token: tokens.owner,
    body: { permissions: [...target.permissions, "patients.create"] },
  });
  assert.equal(res.status, 200);
  assert.ok(res.data.role.permissions.includes("patients.create"));

  const allowed = await api("POST", "/api/clinic/patients", {
    token: tokens.denied,
    body: { name: "Now Allowed", phone: "03000000016" },
  });
  assert.equal(allowed.status, 201);
});

test("a non-owner cannot assign a full-access role to a new member", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const email = `escalated-${Date.now()}@clinic.test`;
  const res = await api("POST", "/api/team/members", {
    token: tokens.manager,
    body: { email, roleId: fullAccessRoleId },
  });
  assert.equal(res.status, 403);
  assert.equal(await User.countDocuments({ email }), 0);
});

test("a settings-manager cannot promote their own account but may hire into a pre-existing role", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const members = (await api("GET", "/api/team/members", { token: tokens.manager })).data.members;
  const self = members.find((m) => m.email === "rbac-manager@clinic.test");
  assert.ok(self);

  const selfPromotion = await api("PATCH", `/api/team/members/${self.id}`, {
    token: tokens.manager,
    body: { roleId: deniedRoleId },
  });
  assert.equal(selfPromotion.status, 403);
  const unchanged = (await api("GET", "/api/team/members", { token: tokens.manager })).data.members.find(
    (m) => m.id === self.id
  );
  assert.equal(unchanged.role.slug, "settings-admin");

  // Hiring into a pre-existing non-owner role is allowed even without holding
  // its permissions (the owner seeded that preset for exactly this purpose).
  const hire = await api("POST", "/api/team/members", {
    token: tokens.manager,
    body: { email: `hire-${Date.now()}@clinic.test`, roleId: deniedRoleId },
  });
  assert.equal(hire.status, 201);

  const ownerHire = await api("POST", "/api/team/members", {
    token: tokens.owner,
    body: { email: `owner-hire-${Date.now()}@clinic.test`, roleId: deniedRoleId },
  });
  assert.equal(ownerHire.status, 201);
});

test("patients.edit is enforced separately from patients.view and patients.create", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const deniedDelete = await api("DELETE", `/api/clinic/patients/${firstPatientId}`, { token: tokens.accountant });
  assert.equal(deniedDelete.status, 403);

  const deniedCreate = await api("POST", "/api/clinic/patients", {
    token: tokens.accountant,
    body: { name: "Accountant Patient", phone: "03000000017" },
  });
  assert.equal(deniedCreate.status, 403);

  const ownerCreated = await api("POST", "/api/clinic/patients", {
    token: tokens.owner,
    body: { name: "Owner Patient", phone: "03000000018" },
  });
  assert.equal(ownerCreated.status, 201);
  const ownerId = ownerCreated.data.patient.id;

  const deniedDeleteAgain = await api("DELETE", `/api/clinic/patients/${ownerId}`, { token: tokens.accountant });
  assert.equal(deniedDeleteAgain.status, 403);

  const doctorEdit = await api("PATCH", `/api/clinic/patients/${ownerId}`, {
    token: tokens.doctor,
    body: { notes: "Reviewed by doctor" },
  });
  assert.equal(doctorEdit.status, 200);
  assert.equal(doctorEdit.data.patient.notes, "Reviewed by doctor");
});
