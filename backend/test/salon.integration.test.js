"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");
require("../src/app");

const {
  Tenant,
  SalonCustomer,
  SalonServiceCategory,
  SalonService,
  SalonStaff,
  SalonAppointment,
  SalonProduct,
  SalonInvoice,
  SalonPayment,
  SalonStockMovement,
  SalonSalary,
} = require("../src/models");
const billing = require("../src/services/salon/billing.service");
const inventory = require("../src/services/salon/inventory.service");
const payroll = require("../src/services/salon/payroll.service");
const analytics = require("../src/services/salon/analytics.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_salon_test";
let databaseAvailable = false;
let tenant;
let customer;
let staff;
let service;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `salon-${Date.now()}`, name: "Integration Salon", industry: "SALON" });
    const category = await SalonServiceCategory.create({ tenantId: tenant._id, name: "Hair" });
    service = await SalonService.create({ tenantId: tenant._id, categoryId: category._id, name: "Haircut", duration: 30, price: 2000, commissionRate: 20 });
    customer = await SalonCustomer.create({ tenantId: tenant._id, customerNo: "C-0001", name: "Integration Client", phone: "03000000000" });
    staff = await SalonStaff.create({ tenantId: tenant._id, name: "Integration Stylist", phone: "03000000001", role: "Stylist", salary: 50000, commissionRate: 20 });
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
    customerId: customer._id,
    amount: 2000,
    dueDate: new Date(Date.now() + 86400000),
  });
  assert.equal(invoice.status, "PENDING");

  const partial = await billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 800, method: "CASH" });
  assert.equal(partial.invoice.status, "PARTIAL");
  assert.equal(partial.invoice.paidAmount, 800);

  await assert.rejects(
    billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 1300, method: "CASH" }),
    /outstanding balance/
  );

  const settled = await billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 1200, method: "CARD" });
  assert.equal(settled.invoice.status, "PAID");
  assert.equal(settled.invoice.paidAmount, 2000);
  assert.equal(await SalonPayment.countDocuments({ invoiceId: invoice._id }), 2);

  await billing.deletePayment({ tenantId: tenant._id, id: settled.payment._id || settled.payment.id });
  const reopened = await SalonInvoice.findById(invoice._id).lean();
  assert.equal(reopened.status, "PARTIAL");
  assert.equal(reopened.paidAmount, 800);
});

test("inventory movements update stock atomically and reject insufficient stock", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const product = await SalonProduct.create({
    tenantId: tenant._id,
    name: "Integration Serum",
    category: "HAIRCARE",
    quantity: 10,
    costPrice: 500,
    sellPrice: 900,
  });

  const updated = await inventory.recordMovement({ tenantId: tenant._id, itemId: product._id, type: "SALE", quantity: 4 });
  assert.equal(updated.quantity, 6);
  assert.equal(await SalonStockMovement.countDocuments({ itemId: product._id }), 1);
  await assert.rejects(
    inventory.recordMovement({ tenantId: tenant._id, itemId: product._id, type: "SALE", quantity: 20 }),
    /Insufficient stock/
  );
  assert.equal((await SalonProduct.findById(product._id)).quantity, 6);
});

test("payroll generation derives commission from completed appointments", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await SalonAppointment.create({
    tenantId: tenant._id,
    customerId: customer._id,
    staffId: staff._id,
    serviceIds: [service._id],
    date: now,
    startTime: "10:00",
    amount: 5000,
    total: 5000,
    status: "COMPLETED",
  });

  const result = await payroll.generate({ tenantId: tenant._id, month, overwrite: true });
  assert.ok(result.created >= 1);

  const salary = await SalonSalary.findOne({ tenantId: tenant._id, staffId: staff._id, month }).lean();
  assert.equal(salary.baseSalary, 50000);
  assert.equal(salary.commission, 1000);
  assert.equal(salary.netPay, 51000);

  const paid = await payroll.markPaid({ tenantId: tenant._id, id: salary._id, paymentMethod: "BANK_TRANSFER" });
  assert.equal(paid.status, "PAID");
  assert.ok(paid.paidAt);
});

test("analytics dashboard reports tenant-scoped figures", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const dash = await analytics.dashboard({ tenantId: tenant._id });
  assert.equal(dash.customers.total, 1);
  assert.equal(dash.staffCount, 1);
  assert.ok(dash.revenue.currentMonth >= 0);
  assert.ok(Array.isArray(dash.topServices));
});
