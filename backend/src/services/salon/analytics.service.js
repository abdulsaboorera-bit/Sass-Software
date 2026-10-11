"use strict";

const mongoose = require("mongoose");
const {
  SalonCustomer, SalonAppointment, SalonPayment, SalonInvoice, SalonProduct,
  SalonExpense, SalonStaff, SalonSalary, SalonSettings,
} = require("../../models");
const { monthRange, dayKeyInTimezone } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function customerStats({ tenantId }) {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [total, newThisMonth] = await Promise.all([
    SalonCustomer.countDocuments({ tenantId, isActive: true }),
    SalonCustomer.countDocuments({ tenantId, createdAt: { $gte: start, $lte: end } }),
  ]);
  return { total, newThisMonth };
}

async function appointmentStats({ tenantId, timezone }) {
  const now = new Date();
  const tz = timezone || (await SalonSettings.findOne({ tenantId }).select("timezone").lean())?.timezone || "Asia/Karachi";
  const today = dayKeyInTimezone(now, tz);
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [todayCount, upcoming, completedMonth, cancelledMonth] = await Promise.all([
    SalonAppointment.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: new Date(`${today}T00:00:00`), $lte: new Date(`${today}T23:59:59.999`) } } },
      { $count: "count" },
    ]).then((r) => r[0]?.count || 0),
    SalonAppointment.countDocuments({ tenantId, status: { $in: ["SCHEDULED", "CONFIRMED"] }, date: { $gte: now } }),
    SalonAppointment.countDocuments({ tenantId, status: "COMPLETED", date: { $gte: start, $lte: end } }),
    SalonAppointment.countDocuments({ tenantId, status: { $in: ["CANCELLED", "NO_SHOW"] }, date: { $gte: start, $lte: end } }),
  ]);
  return { today: todayCount, upcoming, completedThisMonth: completedMonth, cancelledThisMonth: cancelledMonth };
}

/** Monthly received-payment totals for the last `months` months. */
async function revenue({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [rows, monthRows] = await Promise.all([
    SalonPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: from } } },
      { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: 1, count: 1 } },
    ]),
    SalonPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  const thisMonth = monthRows[0];
  return { series: rows, currentMonth: thisMonth ? thisMonth.total : 0 };
}

async function pendingPayments({ tenantId }) {
  const rows = await SalonInvoice.aggregate([
    { $match: { tenantId: oid(tenantId), status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } } },
    { $group: { _id: "$status", count: { $sum: 1 }, outstanding: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } },
  ]);
  const summary = { pending: 0, partial: 0, overdue: 0, totalOutstanding: 0, count: 0 };
  for (const r of rows) {
    const key = r._id.toLowerCase();
    if (summary[key] !== undefined) summary[key] = r.count;
    summary.totalOutstanding += r.outstanding;
    summary.count += r.count;
  }
  summary.totalOutstanding = +summary.totalOutstanding.toFixed(2);
  return summary;
}

async function inventoryStats({ tenantId }) {
  const [totalItems, lowStockCount, totalValue] = await Promise.all([
    SalonProduct.countDocuments({ tenantId, isActive: true }),
    SalonProduct.countDocuments({ tenantId, isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } }),
    SalonProduct.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
  ]);
  return { totalItems, lowStockCount, totalValue: totalValue[0]?.total || 0 };
}

async function expenseStats({ tenantId }) {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [thisMonth, todayRow] = await Promise.all([
    SalonExpense.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    SalonExpense.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  return { currentMonth: thisMonth[0]?.total || 0, monthCount: thisMonth[0]?.count || 0, today: todayRow[0]?.total || 0 };
}

async function payrollStats({ tenantId }) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await SalonSalary.aggregate([
    { $match: { tenantId: oid(tenantId), month } },
    {
      $group: {
        _id: null,
        total: { $sum: "$netPay" },
        paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);
  const r = rows[0] || { total: 0, paid: 0, count: 0 };
  return { month, total: r.total, paid: r.paid, pending: +(r.total - r.paid).toFixed(2), count: r.count };
}

/** Most-booked services this month (unwinds the appointment serviceIds). */
async function topServices({ tenantId, limit = 5 }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  return SalonAppointment.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } },
    { $unwind: "$serviceIds" },
    { $group: { _id: "$serviceIds", bookings: { $sum: 1 } } },
    { $sort: { bookings: -1 } },
    { $limit: limit },
    { $lookup: { from: "salonservices", localField: "_id", foreignField: "_id", as: "service" } },
    { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, serviceId: "$_id", name: "$service.name", price: "$service.price", bookings: 1 } },
  ]);
}

/** Staff ranked by completed appointment revenue this month. */
async function topStaff({ tenantId, limit = 5 }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  return SalonAppointment.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end }, status: "COMPLETED", staffId: { $ne: null } } },
    { $group: { _id: "$staffId", services: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $lookup: { from: "salonstaffs", localField: "_id", foreignField: "_id", as: "staff" } },
    { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, staffId: "$_id", name: "$staff.name", role: "$staff.role", services: 1, revenue: 1 } },
  ]);
}

/** One-call dashboard payload for the salon home screen. */
async function dashboard({ tenantId }) {
  const settings = await SalonSettings.findOne({ tenantId }).select("timezone").lean();
  const [customers, appointments, rev, pending, inventory, expenses, payroll, staffCount, topSvc, topStf] = await Promise.all([
    customerStats({ tenantId }),
    appointmentStats({ tenantId, timezone: settings?.timezone || "Asia/Karachi" }),
    revenue({ tenantId, months: 6 }),
    pendingPayments({ tenantId }),
    inventoryStats({ tenantId }),
    expenseStats({ tenantId }),
    payrollStats({ tenantId }),
    SalonStaff.countDocuments({ tenantId, isActive: true }),
    topServices({ tenantId, limit: 5 }),
    topStaff({ tenantId, limit: 5 }),
  ]);
  return { customers, appointments, revenue: rev, pendingPayments: pending, inventory, expenses, payroll, staffCount, topServices: topSvc, topStaff: topStf, generatedAt: new Date() };
}

module.exports = {
  customerStats,
  appointmentStats,
  revenue,
  pendingPayments,
  inventoryStats,
  expenseStats,
  payrollStats,
  topServices,
  topStaff,
  dashboard,
};
