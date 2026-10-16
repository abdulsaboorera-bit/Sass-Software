"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");

const { Tenant, Member, MembershipPlan, Coupon, Booking } = require("../src/models");
const couponService = require("../src/services/coupon.service");
const loyalty = require("../src/services/loyalty.service");
const datasets = require("../src/services/datasets.service");
const notify = require("../src/services/notification.service");
const { search } = require("../src/services/search.service");
const { lookup } = require("../src/services/lookup.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_core_test";
let databaseAvailable = false;
let tenant;
let plan;

function createMember(memberNo, name, phone = "03000000000") {
  return Member.create({
    tenantId: tenant._id,
    memberNo,
    name,
    phone,
    planId: plan._id,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "ACTIVE",
  });
}

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;
    tenant = await Tenant.create({ slug: `core-${Date.now()}`, name: "Core Test Co", industry: "GYM" });
    plan = await MembershipPlan.create({ tenantId: tenant._id, name: "Core Plan", duration: 30, price: 1000 });
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

test("dataset CSV export includes seeded member rows", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  await createMember("CORE-1", "Core Member", "03001112223");
  const { csv, filename } = await datasets.buildCsv("gym.members", tenant._id);
  assert.equal(filename, "gym-members.csv");
  assert.ok(csv.split("\n")[0].includes("Member No"));
  assert.ok(csv.includes("Core Member"));
});

test("dataset CSV import maps field headers to model fields", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const { Book } = require("../src/models");
  const csv = "title,author,price,costPrice\nImported Book,Some Author,500,300\n";
  const result = await datasets.importCsv("bookshop.books", tenant._id, csv);
  assert.equal(result.created, 1);
  const book = await Book.findOne({ tenantId: tenant._id, title: "Imported Book" }).lean();
  assert.equal(book.author, "Some Author");
  assert.equal(book.price, 500);
});

test("coupons validate, cap the discount, and increment usage on redeem", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const coupon = await Coupon.create({ tenantId: tenant._id, code: "SAVE10", type: "PERCENT", value: 10, maxDiscount: 50 });
  const ok = await couponService.validateCoupon(tenant._id, "save10", 100);
  assert.equal(ok.discount, 10);
  assert.equal(ok.total, 90);
  const capped = await couponService.validateCoupon(tenant._id, "SAVE10", 1000);
  assert.equal(capped.discount, 50);
  const redeemed = await couponService.redeemCoupon(tenant._id, coupon._id);
  assert.equal(redeemed.usedCount, 1);
});

test("loyalty adjust updates the customer balance and rejects overdraft", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const member = await createMember("LOY-1", "Loyal Member");
  const plus = await loyalty.adjustPoints({ tenantId: tenant._id, customerType: "GYM", customerId: member._id, points: 50 });
  assert.equal(plus.balance, 50);
  const minus = await loyalty.adjustPoints({ tenantId: tenant._id, customerType: "GYM", customerId: member._id, points: -20 });
  assert.equal(minus.balance, 30);
  const fresh = await Member.findById(member._id).lean();
  assert.equal(fresh.loyaltyPoints, 30);
  await assert.rejects(
    () => loyalty.adjustPoints({ tenantId: tenant._id, customerType: "GYM", customerId: member._id, points: -100 }),
    /Insufficient loyalty points/
  );
});

test("whatsapp notifications queue a wa.me deep link on dispatch", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const member = await createMember("WA-1", "Wa Member", "03001234000");
  const n = await notify.membershipExpiringSoon(member, 3);
  assert.ok(n.link && n.link.includes("wa.me/923001234000"), "emit should pre-compute the wa.me link");
  const result = await notify.dispatchPending({ tenantId: tenant._id });
  assert.ok(result.queued >= 1);
  const dispatches = await notify.markSent(tenant._id, n._id);
  assert.equal(dispatches.status, "SENT");
});

test("global search finds permitted records across modules", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  await createMember("SRCH-1", "Zebra Unique");
  const groups = await search({ tenantId: tenant._id, industry: "GYM", permissions: ["*"], q: "Zebra" });
  assert.ok(groups.some((g) => g.items.some((i) => i.title === "Zebra Unique")));
});

test("barcode lookup resolves a member by member number", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  const member = await createMember("SCAN-1", "Scan Me");
  const hit = await lookup({ tenantId: tenant._id, industry: "GYM", permissions: ["*"], code: "SCAN-1" });
  assert.equal(hit.label, "Member");
  assert.equal(hit.item._id.toString(), member._id.toString());
});

test("public booking requests are stored and tenant-scoped", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB unavailable");
  await Booking.create({ tenantId: tenant._id, type: "BOOKING", name: "Public Visitor", phone: "03005556677", service: "Consultation" });
  const count = await Booking.countDocuments({ tenantId: tenant._id, status: "NEW" });
  assert.equal(count, 1);
});
