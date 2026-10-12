"use strict";

const { FeePayment, FeeStructure, Student, SchoolClass } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput, monthRange } = require("../../utils/dates");

/** Normalise "YYYY-MM" (or a year+month pair) into a stored month string. */
function monthKey(month, year) {
  if (month && /^\d{4}-\d{2}$/.test(String(month))) return String(month);
  const y = year || new Date().getFullYear();
  const m = String(month || new Date().getMonth() + 1).padStart(2, "0");
  if (!/^\d{4}$/.test(String(y))) throw ApiError.badRequest("A valid month is required");
  return `${y}-${m}`;
}

function netFor({ amount, discount = 0, fine = 0 }) {
  return Math.max(0, Number(amount || 0) - Number(discount || 0) + Number(fine || 0));
}

/** Default due date = the settings/submission month's due day, else month end. */
function defaultDue(month) {
  const [y, m] = String(month).split("-").map(Number);
  const { end } = monthRange(y, m);
  return end;
}

async function ensureStudent(tenantId, studentId) {
  const student = await Student.findOne({ _id: studentId, tenantId }).select("_id").lean();
  if (!student) throw ApiError.notFound("Student not found");
}

/** Create a single fee voucher for a student. */
async function createVoucher({ tenantId, studentId, feeStructureId, amount, discount = 0, fine = 0, month, year, dueDate, remarks }) {
  if (!studentId) throw ApiError.badRequest("studentId is required");
  await ensureStudent(tenantId, studentId);
  const key = monthKey(month, year);
  const net = netFor({ amount, discount, fine });
  const parsedDue = dueDate ? parseDateInput(dueDate) : defaultDue(key);
  if (dueDate && !parsedDue) throw ApiError.badRequest("Invalid due date");

  const voucher = await FeePayment.create({
    tenantId,
    studentId,
    feeStructureId: feeStructureId || null,
    amount: Number(amount || 0),
    discount: Number(discount || 0),
    fine: Number(fine || 0),
    netAmount: net,
    month: key,
    year: Number(key.split("-")[0]),
    dueDate: parsedDue,
    status: net === 0 ? "PAID" : "PENDING",
    paidAt: net === 0 ? new Date() : null,
    receiptNo: net === 0 ? invoiceRef("RCP") : undefined,
    remarks,
  });
  return voucher;
}

/** Generate (upsert) monthly vouchers for every active student in a class. */
async function generateForClass({ tenantId, classId, month, year, dueDate, overwrite = false }) {
  if (!classId) throw ApiError.badRequest("classId is required");
  const schoolClass = await SchoolClass.findOne({ _id: classId, tenantId }).select("_id feeAmount").lean();
  if (!schoolClass) throw ApiError.notFound("Class not found");
  const structure = await FeeStructure.findOne({ tenantId, classId, isActive: true, frequency: "MONTHLY" }).lean();

  const key = monthKey(month, year);
  const amount = Number(structure?.amount ?? schoolClass.feeAmount ?? 0);
  if (!amount) throw ApiError.badRequest("No monthly fee is configured for this class");

  const students = await Student.find({ tenantId, classId, status: "ACTIVE" }).select("_id").lean();

  let created = 0;
  let skipped = 0;
  for (const student of students) {
    const existing = await FeePayment.findOne({ tenantId, studentId: student._id, month: key }).lean();
    if (existing && !overwrite) { skipped += 1; continue; }
    if (existing && existing.status === "PAID") { skipped += 1; continue; }
    const net = netFor({ amount });
    const parsedDue = dueDate ? parseDateInput(dueDate) : defaultDue(key);
    await FeePayment.findOneAndUpdate(
      { tenantId, studentId: student._id, month: key },
      {
        $set: {
          tenantId,
          studentId: student._id,
          feeStructureId: structure?._id || null,
          amount,
          discount: 0,
          fine: 0,
          netAmount: net,
          month: key,
          year: Number(key.split("-")[0]),
          dueDate: parsedDue,
          status: "PENDING",
          paidAt: null,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    created += 1;
  }
  return { month: key, created, skipped, students: students.length, amount };
}

async function listVouchers({ tenantId, studentId, month, year, status, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (studentId) filter.studentId = studentId;
  if (month) filter.month = monthKey(month, year);
  else if (year) filter.year = Number(year);
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [rows, total, all] = await Promise.all([
    FeePayment.find(filter).populate("student", "name admissionNo").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    FeePayment.countDocuments(filter),
    FeePayment.find(filter).select("amount netAmount status").lean(),
  ]);

  const summary = all.reduce(
    (s, p) => {
      s.totalAmount += Number(p.netAmount ?? p.amount ?? 0);
      s.totalCount += 1;
      if (p.status === "PAID") s.paidCount += 1;
      else if (p.status === "PENDING") s.pendingCount += 1;
      else if (p.status === "OVERDUE") s.overdueCount += 1;
      return s;
    },
    { totalAmount: 0, totalCount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 }
  );

  return { payments: rows, summary, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/** Collect / settle a voucher (or record a direct fee collection). */
async function payVoucher({ tenantId, id, method, discount, fine, remarks }) {
  const voucher = await FeePayment.findOne({ _id: id, tenantId });
  if (!voucher) throw ApiError.notFound("Fee voucher not found");
  if (voucher.status === "CANCELLED") throw ApiError.badRequest("Cannot pay a cancelled voucher");
  if (voucher.status === "PAID") throw ApiError.badRequest("Voucher is already paid");

  if (discount !== undefined) voucher.discount = Number(discount);
  if (fine !== undefined) voucher.fine = Number(fine);
  voucher.netAmount = netFor(voucher);
  voucher.status = "PAID";
  voucher.paidAt = new Date();
  voucher.method = method || "CASH";
  voucher.receiptNo = voucher.receiptNo || invoiceRef("RCP");
  if (remarks !== undefined) voucher.remarks = remarks;
  await voucher.save();
  return voucher.toObject();
}

async function updateVoucher({ tenantId, id, data }) {
  const voucher = await FeePayment.findOne({ _id: id, tenantId });
  if (!voucher) throw ApiError.notFound("Fee voucher not found");
  if (voucher.status === "PAID") throw ApiError.badRequest("A paid voucher cannot be edited");
  const allowed = ["amount", "discount", "fine", "dueDate", "remarks", "method", "status"];
  for (const key of allowed) {
    if (data[key] !== undefined) voucher[key] = key === "dueDate" ? parseDateInput(data[key]) : data[key];
  }
  voucher.netAmount = netFor(voucher);
  await voucher.save();
  return voucher.toObject();
}

async function deleteVoucher({ tenantId, id }) {
  const voucher = await FeePayment.findOne({ _id: id, tenantId });
  if (!voucher) throw ApiError.notFound("Fee voucher not found");
  if (voucher.status === "PAID") throw ApiError.badRequest("A paid voucher cannot be deleted");
  await voucher.deleteOne();
  return { success: true };
}

async function cancelVoucher({ tenantId, id }) {
  const voucher = await FeePayment.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!voucher) throw ApiError.notFound("Open voucher not found");
  return voucher;
}

/** Mark every unpaid voucher past its due date as OVERDUE. Idempotent. */
async function markOverdue({ tenantId, now = new Date() }) {
  const filter = { status: "PENDING", dueDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;
  const result = await FeePayment.updateMany(filter, { $set: { status: "OVERDUE" } });
  return { marked: result.modifiedCount || 0 };
}

async function summary({ tenantId, month, year }) {
  const filter = { tenantId };
  if (month) filter.month = monthKey(month, year);
  const rows = await FeePayment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        expected: { $sum: "$netAmount" },
        collected: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netAmount", 0] } },
        count: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] } },
      },
    },
  ]);
  const r = rows[0] || { expected: 0, collected: 0, count: 0, paid: 0, pending: 0, overdue: 0 };
  return { ...r, _id: undefined, outstanding: +(r.expected - r.collected).toFixed(2) };
}

/** Legacy direct collection used by the simple fees page: records a PAID voucher. */
async function collectFee({ tenantId, studentId, amount, month, year, method, remarks }) {
  if (!studentId) throw ApiError.badRequest("studentId is required");
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw ApiError.badRequest("A valid amount is required");
  await ensureStudent(tenantId, studentId);
  const key = monthKey(month, year);
  const voucher = await FeePayment.create({
    tenantId,
    studentId,
    amount: value,
    discount: 0,
    fine: 0,
    netAmount: value,
    month: key,
    year: Number(key.split("-")[0]),
    dueDate: new Date(),
    status: "PAID",
    paidAt: new Date(),
    method: method || "CASH",
    receiptNo: invoiceRef("RCP"),
    remarks,
  });
  return voucher;
}

module.exports = {
  createVoucher,
  generateForClass,
  listVouchers,
  payVoucher,
  updateVoucher,
  deleteVoucher,
  cancelVoucher,
  markOverdue,
  summary,
  collectFee,
  monthKey,
};
