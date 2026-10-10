"use strict";

const mongoose = require("mongoose");
const { RestaurantSalary, RestaurantStaff, Order } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

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

/** Commission a staff member earned from completed, paid orders they served. */
async function commissionFor({ tenantId, staffId, start, end }) {
  const [row] = await Order.aggregate([
    {
      $match: {
        tenantId: oid(tenantId),
        staffId: oid(staffId),
        status: { $in: ["COMPLETED", "SERVED"] },
        paymentStatus: "PAID",
        paidAt: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
  ]);
  const served = row?.total || 0;
  const staff = await RestaurantStaff.findOne({ _id: staffId, tenantId }).select("commissionRate salary").lean();
  const rate = Number(staff?.commissionRate || 0);
  return { served, commission: +(served * rate / 100).toFixed(2) };
}

/** Generate (upsert) payroll rows for a month from the active staff roster. */
async function generate({ tenantId, month, overwrite = false }) {
  const { start, end, key } = monthBounds(month);
  const staffList = await RestaurantStaff.find({ tenantId, isActive: true }).lean();

  let created = 0;
  let skipped = 0;
  for (const staff of staffList) {
    const existing = await RestaurantSalary.findOne({ tenantId, staffId: staff._id, month: key });
    if (existing && !overwrite) {
      skipped += 1;
      continue;
    }
    const { commission } = await commissionFor({ tenantId, staffId: staff._id, start, end });
    const baseSalary = Number(staff.salary || 0);
    const bonuses = existing ? Number(existing.bonuses || 0) : 0;
    const deductions = existing ? Number(existing.deductions || 0) : 0;
    const netPay = baseSalary + commission + bonuses - deductions;
    if (existing && existing.status === "PAID") {
      skipped += 1;
      continue;
    }
    await RestaurantSalary.findOneAndUpdate(
      { tenantId, staffId: staff._id, month: key },
      { $set: { baseSalary, commission, bonuses, deductions, netPay: Math.max(0, netPay), status: "PENDING", paidAt: null } },
      { upsert: true, new: true, runValidators: true }
    );
    created += 1;
  }
  return { month: key, created, skipped, staffTotal: staffList.length };
}

async function list({ tenantId, month, staffId, status, page = 1, limit = 100 }) {
  const filter = { tenantId };
  if (month) filter.month = monthBounds(month).key;
  if (staffId) filter.staffId = staffId;
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    RestaurantSalary.find(filter).populate("staff", "name role phone").sort({ month: -1, createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    RestaurantSalary.countDocuments(filter),
  ]);
  return { salaries: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const salary = await RestaurantSalary.findOne({ _id: id, tenantId }).populate("staff", "name role phone").lean({ virtuals: true });
  if (!salary) throw ApiError.notFound("Salary record not found");
  return salary;
}

function recalc(doc) {
  const net = Number(doc.baseSalary || 0) + Number(doc.commission || 0) + Number(doc.bonuses || 0) - Number(doc.deductions || 0);
  doc.netPay = Math.max(0, net);
  return doc;
}

async function update({ tenantId, id, data }) {
  const existing = await RestaurantSalary.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Salary record not found");
  if (existing.status === "PAID") throw ApiError.badRequest("A paid salary record cannot be edited");
  const updates = sanitize(data);
  delete updates.staffId;
  delete updates.month;
  delete updates.netPay;
  delete updates.status;
  Object.assign(existing, updates);
  recalc(existing);
  await existing.save();
  return existing.toObject();
}

async function markPaid({ tenantId, id, paymentMethod }) {
  const salary = await RestaurantSalary.findOneAndUpdate(
    { _id: id, tenantId, status: "PENDING" },
    { $set: { status: "PAID", paidAt: new Date(), ...(paymentMethod ? { paymentMethod } : {}) } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!salary) throw ApiError.notFound("Pending salary record not found");
  return salary;
}

async function remove({ tenantId, id }) {
  const salary = await RestaurantSalary.findOne({ _id: id, tenantId });
  if (!salary) throw ApiError.notFound("Salary record not found");
  if (salary.status === "PAID") throw ApiError.badRequest("A paid salary record cannot be deleted");
  await salary.deleteOne();
  return { success: true };
}

async function summary({ tenantId, month }) {
  const filter = { tenantId };
  if (month) filter.month = monthBounds(month).key;
  const rows = await RestaurantSalary.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: "$netPay" },
        base: { $sum: "$baseSalary" },
        commission: { $sum: "$commission" },
        bonuses: { $sum: "$bonuses" },
        deductions: { $sum: "$deductions" },
        count: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } },
      },
    },
  ]);
  const r = rows[0] || { total: 0, base: 0, commission: 0, bonuses: 0, deductions: 0, count: 0, paid: 0 };
  return { ...r, _id: undefined, pending: +(r.total - r.paid).toFixed(2) };
}

module.exports = { generate, list, getById, update, markPaid, remove, summary, monthBounds, commissionFor };