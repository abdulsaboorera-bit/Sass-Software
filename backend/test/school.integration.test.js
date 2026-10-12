"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");
require("../src/app");

const {
  Tenant,
  Teacher,
  SchoolClass,
  Subject,
  Student,
  FeeStructure,
  FeePayment,
  SchoolSalary,
  Exam,
  ExamResult,
  SchoolSettings,
} = require("../src/models");
const billing = require("../src/services/school/billing.service");
const payroll = require("../src/services/school/payroll.service");
const exams = require("../src/services/school/exam.service");
const analytics = require("../src/services/school/analytics.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_school_test";
let databaseAvailable = false;
let tenant;
let schoolClass;
let teacher;
let student;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `school-${Date.now()}`, name: "Integration School", industry: "SCHOOL" });
    teacher = await Teacher.create({ tenantId: tenant._id, employeeNo: "EMP-0001", name: "Integration Teacher", salary: 60000, isActive: true });
    schoolClass = await SchoolClass.create({ tenantId: tenant._id, name: "Grade 3", section: "A", teacherId: teacher._id, feeAmount: 5000 });
    student = await Student.create({
      tenantId: tenant._id,
      admissionNo: "ADM-0001",
      name: "Integration Student",
      fatherName: "Father Name",
      fatherPhone: "03000000000",
      classId: schoolClass._id,
      status: "ACTIVE",
    });
    await SchoolSettings.create({ tenantId: tenant._id, schoolName: "Integration School" });
  } catch {
    databaseAvailable = false;
    await mongoose.disconnect().catch(() => {});
  }
});

after(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

test("billing issues vouchers, collects payment and reconciles summary", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const voucher = await billing.createVoucher({ tenantId: tenant._id, studentId: student._id, amount: 5000, discount: 500, month });
  assert.equal(voucher.status, "PENDING");
  assert.equal(voucher.netAmount, 4500);
  assert.equal(voucher.month, month);

  const paid = await billing.payVoucher({ tenantId: tenant._id, id: voucher._id, method: "CASH" });
  assert.equal(paid.status, "PAID");
  assert.ok(paid.receiptNo);

  await assert.rejects(
    billing.payVoucher({ tenantId: tenant._id, id: voucher._id, method: "CASH" }),
    /already paid/
  );

  const summary = await billing.summary({ tenantId: tenant._id, month });
  assert.equal(summary.expected, 4500);
  assert.equal(summary.collected, 4500);
  assert.equal(summary.paid, 1);
  assert.equal(summary.outstanding, 0);
});

test("fee generation creates vouchers for active students and can mark overdue", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  await FeeStructure.create({ tenantId: tenant._id, classId: schoolClass._id, name: "Monthly Fee", frequency: "MONTHLY", amount: 5000 });

  const result = await billing.generateForClass({ tenantId: tenant._id, classId: schoolClass._id, month: "2024-01", dueDate: "2024-01-10" });
  assert.equal(result.created, 1);
  assert.equal(result.amount, 5000);

  const marked = await billing.markOverdue({ tenantId: tenant._id, now: new Date("2024-02-01") });
  assert.equal(marked.marked, 1);
  const stored = await FeePayment.findOne({ tenantId: tenant._id, month: "2024-01" }).lean();
  assert.equal(stored.status, "OVERDUE");
});

test("payroll generates salary rows from the active teacher roster and marks paid", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const result = await payroll.generate({ tenantId: tenant._id, month: "2024-01", overwrite: true });
  assert.ok(result.created >= 1);

  const salary = await SchoolSalary.findOne({ tenantId: tenant._id, teacherId: teacher._id, month: "2024-01" }).lean();
  assert.equal(salary.baseSalary, 60000);
  assert.equal(salary.netPay, 60000);

  const paid = await payroll.markPaid({ tenantId: tenant._id, id: salary._id, paymentMethod: "BANK_TRANSFER" });
  assert.equal(paid.status, "PAID");
  assert.ok(paid.paidAt);

  const summary = await payroll.summary({ tenantId: tenant._id, month: "2024-01" });
  assert.equal(summary.total, 60000);
  assert.equal(summary.paid, 60000);
  assert.equal(summary.pending, 0);
});

test("exam marks produce grades and a ranked report card", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const subject = await Subject.create({ tenantId: tenant._id, classId: schoolClass._id, name: "Mathematics", totalMarks: 100 });
  const exam = await Exam.create({ tenantId: tenant._id, name: "Unit Test 1", classId: schoolClass._id, term: "TERM_1" });

  const saved = await exams.saveMarks({
    tenantId: tenant._id,
    examId: exam._id,
    subjectId: subject._id,
    records: [{ studentId: student._id, marks: 85 }],
  });
  assert.equal(saved.saved, 1);

  const result = await ExamResult.findOne({ tenantId: tenant._id, examId: exam._id, studentId: student._id }).lean();
  assert.equal(result.marks, 85);
  assert.equal(result.grade, "A");

  const card = await exams.reportCard({ tenantId: tenant._id, studentId: student._id, examId: exam._id });
  assert.equal(card.obtained, 85);
  assert.equal(card.total, 100);
  assert.equal(card.percent, 85);
  assert.equal(card.position, 1);
  assert.equal(card.passed, true);
});

test("analytics dashboard reports tenant-scoped school figures", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const dash = await analytics.dashboard({ tenantId: tenant._id });
  assert.equal(dash.students.total, 1);
  assert.equal(dash.teachers.total, 1);
  assert.equal(dash.classes, 1);
  assert.ok(dash.fees.expected >= 0);
  assert.ok(Array.isArray(dash.revenue.series));
  assert.ok(Array.isArray(dash.upcomingEvents));
});
