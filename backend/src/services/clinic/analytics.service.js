"use strict";

const mongoose = require("mongoose");
const {
  Patient,
  Doctor,
  Appointment,
  Prescription,
  LabResult,
  ClinicInvoice,
  ClinicPayment,
  ClinicExpense,
  ClinicSalary,
  ClinicSettings,
  Medicine,
  PharmacySale,
} = require("../../models");
const { monthRange, startOfDay, endOfDay, dayKeyInTimezone } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function patientStats({ tenantId }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const [total, newThisMonth] = await Promise.all([
    Patient.countDocuments({ tenantId, isActive: true }),
    Patient.countDocuments({ tenantId, createdAt: { $gte: start, $lte: end } }),
  ]);
  return { total, newThisMonth };
}

async function appointmentStats({ tenantId, timezone }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const [today, upcoming, completedToday, pending] = await Promise.all([
    Appointment.countDocuments({ tenantId, date: { $gte: todayStart, $lte: todayEnd } }),
    Appointment.countDocuments({ tenantId, date: { $gte: now }, status: { $in: ["SCHEDULED", "CONFIRMED"] } }),
    Appointment.countDocuments({ tenantId, date: { $gte: todayStart, $lte: todayEnd }, status: "COMPLETED" }),
    Appointment.countDocuments({ tenantId, status: { $in: ["SCHEDULED", "CONFIRMED"] } }),
  ]);
  return { today, upcoming, completedToday, pending, dayKey: dayKeyInTimezone(now, timezone || "Asia/Karachi") };
}

async function revenue({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const [clinic, pharmacy] = await Promise.all([
    ClinicPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: from } } },
      { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    PharmacySale.aggregate([
      { $match: { tenantId: oid(tenantId), soldAt: { $gte: from }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: { year: { $year: "$soldAt" }, month: { $month: "$soldAt" } }, total: { $sum: "$paidAmount" }, count: { $sum: 1 } } },
    ]),
  ]);
  const merged = new Map();
  for (const row of [...clinic, ...pharmacy]) {
    const key = `${row._id.year}-${row._id.month}`;
    const cur = merged.get(key) || { year: row._id.year, month: row._id.month, total: 0, count: 0 };
    cur.total += row.total;
    cur.count += row.count;
    merged.set(key, cur);
  }
  const series = [...merged.values()].sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [clinicMonth, pharmacyMonth] = await Promise.all([
    ClinicPayment.aggregate([{ $match: { tenantId: oid(tenantId), paidAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    PharmacySale.aggregate([{ $match: { tenantId: oid(tenantId), soldAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
  ]);
  const currentMonth = (clinicMonth[0]?.total || 0) + (pharmacyMonth[0]?.total || 0);
  return { series, currentMonth };
}

async function topDoctors({ tenantId, limit = 5 }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  return Appointment.aggregate([
    { $match: { tenantId: oid(tenantId), status: "COMPLETED", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$doctorId", appointments: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$fee", 0] } } } },
    { $sort: { appointments: -1 } },
    { $limit: limit },
    { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doctor" } },
    { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, doctorId: "$_id", name: "$doctor.name", specialization: "$doctor.specialization", appointments: 1, revenue: 1 } },
  ]);
}

async function inventoryStats({ tenantId }) {
  const [totalItems, lowStockCount, expiredCount, totalValue] = await Promise.all([
    Medicine.countDocuments({ tenantId, isActive: true }),
    Medicine.countDocuments({ tenantId, isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } }),
    Medicine.countDocuments({ tenantId, isActive: true, expiryDate: { $ne: null, $lt: new Date() } }),
    Medicine.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
  ]);
  return { totalItems, lowStockCount, expiredCount, totalValue: totalValue[0]?.total || 0 };
}

async function pharmacyStats({ tenantId }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [todayRow, monthRow] = await Promise.all([
    PharmacySale.aggregate([{ $match: { tenantId: oid(tenantId), soldAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
    PharmacySale.aggregate([{ $match: { tenantId: oid(tenantId), soldAt: { $gte: start, $lte: end }, status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
  ]);
  return { today: { sales: todayRow[0]?.count || 0, revenue: todayRow[0]?.total || 0 }, month: { sales: monthRow[0]?.count || 0, revenue: monthRow[0]?.total || 0 } };
}

async function expenseStats({ tenantId }) {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [thisMonth] = await Promise.all([
    ClinicExpense.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);
  return { currentMonth: thisMonth[0]?.total || 0, monthCount: thisMonth[0]?.count || 0 };
}

async function payrollStats({ tenantId }) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await ClinicSalary.aggregate([
    { $match: { tenantId: oid(tenantId), month } },
    { $group: { _id: null, total: { $sum: "$netPay" }, paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } }, count: { $sum: 1 } } },
  ]);
  const r = rows[0] || { total: 0, paid: 0, count: 0 };
  return { month, total: r.total, paid: r.paid, pending: +(r.total - r.paid).toFixed(2), count: r.count };
}

async function pendingInvoices({ tenantId }) {
  const rows = await ClinicInvoice.aggregate([
    { $match: { tenantId: oid(tenantId), status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } } },
    { $group: { _id: "$status", count: { $sum: 1 }, outstanding: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } },
  ]);
  const summary = { pending: 0, partial: 0, overdue: 0, count: 0, totalOutstanding: 0 };
  for (const r of rows) {
    const key = r._id.toLowerCase();
    if (summary[key] !== undefined) summary[key] = r.count;
    summary.count += r.count;
    summary.totalOutstanding += r.outstanding;
  }
  summary.totalOutstanding = +summary.totalOutstanding.toFixed(2);
  return summary;
}

/** One-call dashboard payload for the clinic home screen. */
async function dashboard({ tenantId }) {
  const settings = await ClinicSettings.findOne({ tenantId }).select("timezone").lean();
  const tz = settings?.timezone || "Asia/Karachi";
  const [patients, appointments, rev, topDocs, inventory, pharmacy, expenses, payroll, invoices, doctorsCount, prescriptions, labResults] = await Promise.all([
    patientStats({ tenantId }),
    appointmentStats({ tenantId, timezone: tz }),
    revenue({ tenantId, months: 6 }),
    topDoctors({ tenantId, limit: 5 }),
    inventoryStats({ tenantId }),
    pharmacyStats({ tenantId }),
    expenseStats({ tenantId }),
    payrollStats({ tenantId }),
    pendingInvoices({ tenantId }),
    Doctor.countDocuments({ tenantId, isActive: true }),
    Prescription.countDocuments({ tenantId, status: "ISSUED" }),
    LabResult.countDocuments({ tenantId, status: "PENDING" }),
  ]);
  return {
    patients,
    appointments,
    revenue: rev,
    topDoctors: topDocs,
    inventory,
    pharmacy,
    expenses,
    payroll,
    pendingInvoices: invoices,
    doctorsCount,
    prescriptionsPending: prescriptions,
    labPending: labResults,
    generatedAt: new Date(),
  };
}

module.exports = {
  dashboard,
  revenue,
  topDoctors,
  patientStats,
  appointmentStats,
  inventoryStats,
  pharmacyStats,
  expenseStats,
  payrollStats,
  pendingInvoices,
};
