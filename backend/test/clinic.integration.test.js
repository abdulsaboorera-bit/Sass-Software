"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");
require("../src/app");

const {
  Tenant,
  Department,
  Doctor,
  Patient,
  Appointment,
  MedicineCategory,
  Medicine,
  PharmacyStockMovement,
  ClinicInvoice,
  ClinicPayment,
  ClinicSalary,
  ClinicSettings,
} = require("../src/models");
const billing = require("../src/services/clinic/billing.service");
const inventory = require("../src/services/clinic/inventory.service");
const pharmacy = require("../src/services/clinic/pharmacy.service");
const payroll = require("../src/services/clinic/payroll.service");
const analytics = require("../src/services/clinic/analytics.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_clinic_test";
let databaseAvailable = false;
let tenant;
let patient;
let doctor;
let medicine;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `clinic-${Date.now()}`, name: "Integration Clinic", industry: "CLINIC" });
    const department = await Department.create({ tenantId: tenant._id, name: "General Medicine" });
    doctor = await Doctor.create({ tenantId: tenant._id, name: "Dr. Integration", specialization: "General Physician", phone: "03000000001", fee: 2000, salary: 100000, commissionRate: 20, departmentId: department._id });
    patient = await Patient.create({ tenantId: tenant._id, patientNo: "P-0001", name: "Integration Patient", phone: "03000000000" });
    const category = await MedicineCategory.create({ tenantId: tenant._id, name: "Analgesics" });
    medicine = await Medicine.create({ tenantId: tenant._id, categoryId: category._id, name: "Integration Panadol", form: "TABLET", quantity: 20, costPrice: 5, sellPrice: 12 });
    await ClinicSettings.create({ tenantId: tenant._id, clinicName: "Integration Clinic" });
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
    patientId: patient._id,
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
  assert.equal(await ClinicPayment.countDocuments({ invoiceId: invoice._id }), 2);

  await billing.deletePayment({ tenantId: tenant._id, id: settled.payment._id || settled.payment.id });
  const reopened = await ClinicInvoice.findById(invoice._id).lean();
  assert.equal(reopened.status, "PARTIAL");
  assert.equal(reopened.paidAmount, 800);
});

test("pharmacy medicine movements update stock atomically and reject insufficient stock", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const updated = await inventory.recordMovement({ tenantId: tenant._id, medicineId: medicine._id, type: "PURCHASE", quantity: 10 });
  assert.equal(updated.quantity, 30);
  const sold = await inventory.recordMovement({ tenantId: tenant._id, medicineId: medicine._id, type: "SALE", quantity: 5 });
  assert.equal(sold.quantity, 25);
  assert.equal(await PharmacyStockMovement.countDocuments({ medicineId: medicine._id }), 2);
  await assert.rejects(
    inventory.recordMovement({ tenantId: tenant._id, medicineId: medicine._id, type: "SALE", quantity: 100 }),
    /Insufficient stock/
  );
  assert.equal((await Medicine.findById(medicine._id)).quantity, 25);
});

test("pharmacy sale deducts stock, links prescription and can be cancelled", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const sale = await pharmacy.createSale({
    tenantId: tenant._id,
    patientId: patient._id,
    items: [{ medicineId: medicine._id, quantity: 3 }],
    paymentMethod: "CASH",
  });
  assert.equal(sale.total, 36);
  assert.equal(sale.status, "PAID");
  assert.equal((await Medicine.findById(medicine._id)).quantity, 22);

  const cancelled = await pharmacy.cancelSale({ tenantId: tenant._id, id: sale.id });
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal((await Medicine.findById(medicine._id)).quantity, 25);

  await assert.rejects(
    pharmacy.createSale({ tenantId: tenant._id, items: [{ medicineId: medicine._id, quantity: 999 }] }),
    /Insufficient stock/
  );
});

test("payroll generation derives commission from completed appointments", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await Appointment.create({
    tenantId: tenant._id,
    patientId: patient._id,
    doctorId: doctor._id,
    date: now,
    time: "10:00",
    fee: 5000,
    status: "COMPLETED",
  });

  const result = await payroll.generate({ tenantId: tenant._id, month, overwrite: true });
  assert.ok(result.created >= 1);

  const salary = await ClinicSalary.findOne({ tenantId: tenant._id, doctorId: doctor._id, month }).lean();
  assert.equal(salary.baseSalary, 100000);
  assert.equal(salary.commission, 1000);
  assert.equal(salary.netPay, 101000);

  const paid = await payroll.markPaid({ tenantId: tenant._id, id: salary._id, paymentMethod: "BANK_TRANSFER" });
  assert.equal(paid.status, "PAID");
  assert.ok(paid.paidAt);
});

test("analytics dashboard reports tenant-scoped figures", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const dash = await analytics.dashboard({ tenantId: tenant._id });
  assert.equal(dash.patients.total, 1);
  assert.equal(dash.doctorsCount, 1);
  assert.ok(dash.revenue.currentMonth >= 0);
  assert.ok(Array.isArray(dash.topDoctors));
  assert.ok(dash.inventory.totalItems >= 1);
});
