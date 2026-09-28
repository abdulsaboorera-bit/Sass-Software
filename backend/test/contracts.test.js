"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { permits } = require("../src/middleware/rbac");
const { paginate } = require("../src/utils/query");
const { computeMembershipStatus, parseDateInput, dayKeyInTimezone, startOfDayInTimezone } = require("../src/utils/dates");
const { sanitize } = require("../src/utils/crud");

test("RBAC keeps assigned trainer access narrower than full member access", () => {
  assert.equal(permits(["members.view.assigned"], "members.view.assigned"), true);
  assert.equal(permits(["members.view.assigned"], "members.view"), false);
  assert.equal(permits(["members.*"], "members.view"), true);
  assert.equal(permits(["members.*"], "billing.view"), false);
});

test("pagination clamps unsafe limits", () => {
  assert.deepEqual(paginate({ page: "0", limit: "5000" }), { page: 1, limit: 100 });
  assert.deepEqual(paginate({ page: "2", limit: "50" }), { page: 2, limit: 50 });
});

test("date-only ranges include the complete local end date", () => {
  const start = parseDateInput("2026-09-27");
  const end = parseDateInput("2026-09-27", true);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getMilliseconds(), 999);
});

test("membership status preserves explicit frozen and cancelled states", () => {
  const now = new Date("2026-09-27T12:00:00.000Z");
  assert.equal(computeMembershipStatus({ status: "FROZEN", endDate: "2026-01-01" }, now), "FROZEN");
  assert.equal(computeMembershipStatus({ status: "CANCELLED", endDate: "2027-01-01" }, now), "CANCELLED");
  assert.equal(computeMembershipStatus({ status: "ACTIVE", endDate: "2026-09-26" }, now), "EXPIRED");
  assert.equal(computeMembershipStatus({ status: "ACTIVE", endDate: "2026-09-28" }, now), "ACTIVE");
});

test("CRUD sanitization removes tenant and identifier overrides", () => {
  assert.deepEqual(
    sanitize({ id: "client-id", tenantId: "other-tenant", name: "Updated", createdAt: "bad" }),
    { name: "Updated" }
  );
  assert.throws(() => sanitize({ $set: { tenantId: "other" } }), /Invalid field name/);
  assert.throws(() => sanitize({ profile: { "tenantId.value": "other" } }), /Invalid nested field name/);
});

test("timezone-aware day boundaries follow the gym timezone", () => {
  const instant = new Date("2026-09-27T19:30:00.000Z");
  assert.equal(dayKeyInTimezone(instant, "UTC"), "2026-09-27");
  assert.equal(dayKeyInTimezone(instant, "Asia/Karachi"), "2026-09-28");
  assert.equal(startOfDayInTimezone(instant, "Asia/Karachi").toISOString(), "2026-09-27T19:00:00.000Z");
});

test("the Express app loads without connecting to MongoDB", () => {
  const app = require("../src/app");
  assert.equal(typeof app, "function");
});
