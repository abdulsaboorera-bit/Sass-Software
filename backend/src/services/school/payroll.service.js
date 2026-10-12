"use strict";

const { SchoolSalary, Teacher } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");

/** Parse "YYYY-MM" into { start, end, key }. */
function monthBounds(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(month || ""));
  if (!match) throw ApiError.badRequest("month must be in YYYY-MM format");
  const year = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) throw ApiError.badRequest("month must be in YYYY-MM format");
  const start = new Date(year, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, m, 0, 23, 59, 59, 999);
  return { start, end, key: `${year}-${String(m).padStart(2, "0")}` };
}

/** Generate (upsert) payroll rows for a month from the active teacher roster. */
async function generate({ tenantId, month, overwrite = false }) {
  const { key } = monthBounds(month);
  const teachers = await Teacher.find({ tenantId, isActive: true }).lean();

  let created = 0;
  let skipped = 0;
  for (const teacher of teachers) {
    const existing = await SchoolSalary.findOne({ tenantId, teacherId: teacher._id, month: key });
    if (existing && !overwrite) { skipped += 1; continue; }
    if (existing && existing.status === "PAID") { skipped += 1; continue; }
    const baseSalary = Number(teacher.salary || 0);
    const bonuses = existing ? Number(existing.bonuses || 0) : 0;
    const deductions = existing ? Number(existing.deductions || 0) : 0;
    const netPay = Math.max(0, baseSalary + bonuses - deductions);
    await SchoolSalary.findOneAndUpdate(
      { tenantId, teacherId: teacher._id, month: key },
      { $set: { baseSalary, bonuses, deductions, netPay, status: "PENDING", paidAt: null } },
      { upsert: true, new: true, runValidators: true }
    );
    created += 1;
  }
  return { month: key, created, skipped, staffTotal: teachers.length };
}

async function list({ tenantId, month, teacherId, status, page = 1, limit = 100 }) {
  const filter = { tenantId };
  if (month) filter.month = monthBounds(month).key;
  if (teacherId) filter.teacherId = teacherId;
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    SchoolSalary.find(filter).populate("staff", "name designation phone").sort({ month: -1, createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    SchoolSalary.countDocuments(filter),
  ]);
  return { salaries: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const salary = await SchoolSalary.findOne({ _id: id, tenantId }).populate("staff", "name designation phone").lean({ virtuals: true });
  if (!salary) throw ApiError.notFound("Salary record not found");
  return salary;
}

function recalc(doc) {
  const net = Number(doc.baseSalary || 0) + Number(doc.bonuses || 0) - Number(doc.deductions || 0);
  doc.netPay = Math.max(0, net);
  return doc;
}

async function update({ tenantId, id, data }) {
  const existing = await SchoolSalary.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Salary record not found");
  if (existing.status === "PAID") throw ApiError.badRequest("A paid salary record cannot be edited");
  const updates = sanitize(data);
  delete updates.teacherId;
  delete updates.month;
  delete updates.netPay;
  delete updates.status;
  Object.assign(existing, updates);
  recalc(existing);
  await existing.save();
  return existing.toObject();
}

async function markPaid({ tenantId, id, paymentMethod }) {
  const salary = await SchoolSalary.findOneAndUpdate(
    { _id: id, tenantId, status: "PENDING" },
    { $set: { status: "PAID", paidAt: new Date(), ...(paymentMethod ? { paymentMethod } : {}) } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!salary) throw ApiError.notFound("Pending salary record not found");
  return salary;
}

async function remove({ tenantId, id }) {
  const salary = await SchoolSalary.findOne({ _id: id, tenantId });
  if (!salary) throw ApiError.notFound("Salary record not found");
  if (salary.status === "PAID") throw ApiError.badRequest("A paid salary record cannot be deleted");
  await salary.deleteOne();
  return { success: true };
}

async function summary({ tenantId, month }) {
  const filter = { tenantId };
  if (month) filter.month = monthBounds(month).key;
  const rows = await SchoolSalary.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$netPay" },
        base: { $sum: "$baseSalary" },
        bonuses: { $sum: "$bonuses" },
        deductions: { $sum: "$deductions" },
        count: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } },
      },
    },
  ]);
  const r = rows[0] || { total: 0, base: 0, bonuses: 0, deductions: 0, count: 0, paid: 0 };
  return { ...r, _id: undefined, pending: +(r.total - r.paid).toFixed(2) };
}

module.exports = { generate, list, getById, update, markPaid, remove, summary, monthBounds };
