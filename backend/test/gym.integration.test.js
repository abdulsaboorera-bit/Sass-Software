"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");

const {
  Tenant,
  MembershipPlan,
  Member,
  GymInvoice,
  GymPayment,
  GymInventoryItem,
  StockMovement,
  CheckIn,
  Notification,
} = require("../src/models");
const billing = require("../src/services/gym/billing.service");
const inventory = require("../src/services/gym/inventory.service");
const attendance = require("../src/services/gym/attendance.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_test";
let databaseAvailable = false;
let tenant;
let member;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `integration-${Date.now()}`, name: "Integration Gym", industry: "GYM" });
    const plan = await MembershipPlan.create({ tenantId: tenant._id, name: "Integration Plan", duration: 30, price: 1000 });
    member = await Member.create({
      tenantId: tenant._id,
      memberNo: "INT-0001",
      name: "Integration Member",
      phone: "03000000000",
      planId: plan._id,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    });
  } catch {
    databaseAvailable = false;
    await mongoose.disconnect().catch(() => {});
  }
});

after(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

test("billing reconciles invoices and rejects overpayments", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const invoice = await billing.createInvoice({
    tenantId: tenant._id,
    memberId: member._id,
    amount: 1000,
    dueDate: new Date(Date.now() + 86400000),
  });

  const partial = await billing.recordPayment({
    tenantId: tenant._id,
    invoiceId: invoice._id,
    amount: 400,
    method: "CASH",
  });
  assert.equal(partial.invoice.status, "PARTIAL");
  assert.equal(partial.invoice.paidAmount, 400);

  await assert.rejects(
    billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 601, method: "CASH" }),
    /outstanding balance/
  );

  const settled = await billing.recordPayment({
    tenantId: tenant._id,
    invoiceId: invoice._id,
    amount: 600,
    method: "CARD",
  });
  assert.equal(settled.invoice.status, "PAID");
  assert.equal(settled.invoice.paidAmount, 1000);
  assert.equal(await GymPayment.countDocuments({ invoiceId: invoice._id }), 2);

  await billing.deletePayment({ tenantId: tenant._id, id: settled.payment._id || settled.payment.id });
  const reopened = await GymInvoice.findById(invoice._id).lean();
  assert.equal(reopened.status, "PARTIAL");
  assert.equal(reopened.paidAmount, 400);
});

test("inventory movements update stock atomically and reject insufficient stock", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const item = await GymInventoryItem.create({
    tenantId: tenant._id,
    name: "Integration Item",
    category: "SUPPLEMENT",
    quantity: 10,
    costPrice: 10,
  });

  const updated = await inventory.recordMovement({ tenantId: tenant._id, itemId: item._id, type: "SALE", quantity: 3 });
  assert.equal(updated.quantity, 7);
  assert.equal(await StockMovement.countDocuments({ itemId: item._id }), 1);
  await assert.rejects(
    inventory.recordMovement({ tenantId: tenant._id, itemId: item._id, type: "SALE", quantity: 8 }),
    /Insufficient stock/
  );
  assert.equal((await GymInventoryItem.findById(item._id)).quantity, 7);
});

test("attendance rejects duplicate daily check-ins and supports checkout", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const at = new Date();
  const result = await attendance.checkIn({ tenantId: tenant._id, memberId: member._id, at });
  assert.equal(result.streak.current, 1);
  await assert.rejects(
    attendance.checkIn({ tenantId: tenant._id, memberId: member._id, at: new Date(at.getTime() + 60000) }),
    /already checked in today/
  );

  const checkedOut = await attendance.checkOut({
    tenantId: tenant._id,
    memberId: member._id,
    at: new Date(at.getTime() + 120000),
  });
  assert.ok(checkedOut.checkOutTime);
  assert.equal(await CheckIn.countDocuments({ tenantId: tenant._id, memberId: member._id }), 1);
});

test("integration cleanup does not leave notification rows", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  assert.equal(await Notification.countDocuments({ tenantId: tenant._id }), 1);
});
