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

test("dataset registry resolves a model for every entry and covers all industries", () => {
  const datasets = require("../src/services/datasets.service");
  for (const industry of ["GYM", "SCHOOL", "CLINIC", "RESTAURANT", "BOOKSHOP", "CAR_RENTAL", "REAL_ESTATE", "SALON"]) {
    const list = datasets.listForIndustry(industry);
    assert.ok(list.length > 0, `${industry} should expose at least one dataset`);
    list.forEach((item) => assert.ok(datasets.resolve(item.key).Model, `${item.key} resolves a model`));
  }
});

test("dataset CSV export renders labels and mapped date columns", () => {
  const datasets = require("../src/services/datasets.service");
  const { toCsv } = require("../src/utils/csv");
  const { columns } = datasets.resolve("gym.members");
  const csv = toCsv([{ memberNo: "M1", name: "Ali", startDate: "2026-01-02T00:00:00.000Z" }], columns).split("\n");
  assert.equal(csv[0].split(",")[0], "Member No");
  assert.ok(csv[1].startsWith("M1,Ali"));
  assert.ok(csv[1].includes("2026-01-02"));
});

test("csv parser round-trips quoted fields with commas and newlines", () => {
  const { parseCsv } = require("../src/utils/csv");
  const { headers, records } = parseCsv('name,note\n"Ali, Khan","line1\nline2"\n');
  assert.deepEqual(headers, ["name", "note"]);
  assert.equal(records[0].name, "Ali, Khan");
  assert.equal(records[0].note, "line1\nline2");
});

test("whatsapp click-to-chat normalises local numbers and encodes the message", () => {
  const { normalizePhone, whatsappLink } = require("../src/utils/whatsapp");
  assert.equal(normalizePhone("0300-1234567"), "923001234567");
  assert.equal(normalizePhone("+92 300 1234567"), "923001234567");
  assert.equal(normalizePhone("00923001234567"), "923001234567");
  assert.equal(whatsappLink("03001234567", "Hi there"), "https://wa.me/923001234567?text=Hi%20there");
  assert.equal(whatsappLink("", "x"), null);
});
