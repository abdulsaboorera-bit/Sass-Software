"use strict";

const mongoose = require("mongoose");
const {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  Attendance,
  FeePayment,
  SchoolExpense,
  SchoolSalary,
  Admission,
  LibraryBook,
  LibraryIssue,
  SchoolEvent,
  Notice,
  SchoolSettings,
} = require("../../models");
const { monthRange, startOfDay, endOfDay, dayKey, addDays } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function studentStats({ tenantId }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const [total, active, newThisMonth] = await Promise.all([
    Student.countDocuments({ tenantId }),
    Student.countDocuments({ tenantId, status: "ACTIVE" }),
    Student.countDocuments({ tenantId, createdAt: { $gte: start, $lte: end } }),
  ]);
  return { total, active, newThisMonth };
}

async function attendanceToday({ tenantId }) {
  const now = new Date();
  const rows = await Attendance.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: startOfDay(now), $lte: endOfDay(now) } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const stats = { present: 0, absent: 0, late: 0, leave: 0, marked: 0 };
  for (const r of rows) {
    stats[r._id.toLowerCase()] = r.count;
    stats.marked += r.count;
  }
  const totalActive = await Student.countDocuments({ tenantId, status: "ACTIVE" });
  return { ...stats, totalActive, dayKey: dayKey(now) };
}

async function attendanceTrend({ tenantId, days = 30 }) {
  const from = startOfDay(addDays(new Date(), -(days - 1)));
  const rows = await Attendance.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: from }, status: { $in: ["PRESENT", "LATE"] } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return { trend: rows.map((r) => ({ day: r._id, count: r.count })) };
}

async function feeStats({ tenantId, month, year }) {
  const filter = { tenantId };
  if (month) filter.month = month;
  const rows = await FeePayment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        expected: { $sum: "$netAmount" },
        collected: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netAmount", 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] } },
      },
    },
  ]);
  const r = rows[0] || { expected: 0, collected: 0, paid: 0, pending: 0, overdue: 0 };
  return { ...r, _id: undefined, outstanding: +(r.expected - r.collected).toFixed(2) };
}

async function revenue({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const rows = await FeePayment.aggregate([
    { $match: { tenantId: oid(tenantId), status: "PAID", paidAt: { $gte: from } } },
    { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$netAmount" }, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const series = rows.map((r) => ({ year: r._id.year, month: r._id.month, total: r.total, count: r.count }));
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [current] = await FeePayment.aggregate([
    { $match: { tenantId: oid(tenantId), status: "PAID", paidAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);
  return { series, currentMonth: current?.total || 0 };
}

async function expenseStats({ tenantId }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const [row] = await SchoolExpense.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  return { currentMonth: row?.total || 0, monthCount: row?.count || 0 };
}

async function payrollStats({ tenantId }) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await SchoolSalary.aggregate([
    { $match: { tenantId: oid(tenantId), month } },
    { $group: { _id: null, total: { $sum: "$netPay" }, paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } }, count: { $sum: 1 } } },
  ]);
  const r = rows[0] || { total: 0, paid: 0, count: 0 };
  return { month, total: r.total, paid: r.paid, pending: +(r.total - r.paid).toFixed(2), count: r.count };
}

async function admissionStats({ tenantId }) {
  const [total, newCount] = await Promise.all([
    Admission.countDocuments({ tenantId }),
    Admission.countDocuments({ tenantId, status: "NEW" }),
  ]);
  return { total, new: newCount };
}

async function libraryStats({ tenantId }) {
  const now = new Date();
  const [books, titles, issued, overdue] = await Promise.all([
    LibraryBook.aggregate([{ $match: { tenantId: oid(tenantId), isActive: true } }, { $group: { _id: null, copies: { $sum: "$totalCopies" }, available: { $sum: "$availableCopies" }, titles: { $sum: 1 } } }]),
    LibraryBook.countDocuments({ tenantId, isActive: true }),
    LibraryIssue.countDocuments({ tenantId, status: "ISSUED" }),
    LibraryIssue.countDocuments({ tenantId, status: "ISSUED", dueDate: { $lt: now } }),
  ]);
  const b = books[0] || { copies: 0, available: 0, titles: 0 };
  return { titles, copies: b.copies, available: b.available, issued, overdue };
}

/** Low-attendance students (below the settings threshold) for the current month. */
async function lowAttendance({ tenantId, limit = 5 }) {
  const settings = await SchoolSettings.findOne({ tenantId }).select("lowAttendanceThreshold").lean();
  const threshold = Number(settings?.lowAttendanceThreshold ?? 75);
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const rows = await Attendance.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$status", ["PRESENT", "LATE"]] }, 1, 0] } },
      },
    },
    { $match: { total: { $gt: 0 } } },
    { $addFields: { percent: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] } } },
    { $match: { percent: { $lt: threshold } } },
    { $sort: { percent: 1 } },
    { $limit: limit },
    { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, studentId: "$_id", name: "$student.name", admissionNo: "$student.admissionNo", percent: 1, total: 1, present: 1 } },
  ]);
  return { threshold, rows };
}

async function upcomingEvents({ tenantId, limit = 5 }) {
  return SchoolEvent.find({ tenantId, startDate: { $gte: startOfDay(new Date()) } }).sort({ startDate: 1 }).limit(limit).lean();
}

async function recentNotices({ tenantId, limit = 5 }) {
  return Notice.find({ tenantId }).sort({ isPinned: -1, publishedAt: -1 }).limit(limit).lean();
}

/** One-call dashboard payload for the school home screen. */
async function dashboard({ tenantId }) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [students, teachers, classes, subjects, attendance, fees, rev, expenses, payroll, admissions, library, events, notices, low] = await Promise.all([
    studentStats({ tenantId }),
    Promise.all([Teacher.countDocuments({ tenantId }), Teacher.countDocuments({ tenantId, isActive: true })]).then(([total, active]) => ({ total, active })),
    SchoolClass.countDocuments({ tenantId }),
    Subject.countDocuments({ tenantId, isActive: true }),
    attendanceToday({ tenantId }),
    feeStats({ tenantId, month }),
    revenue({ tenantId, months: 6 }),
    expenseStats({ tenantId }),
    payrollStats({ tenantId }),
    admissionStats({ tenantId }),
    libraryStats({ tenantId }),
    upcomingEvents({ tenantId, limit: 5 }),
    recentNotices({ tenantId, limit: 5 }),
    lowAttendance({ tenantId, limit: 5 }),
  ]);

  return {
    students,
    teachers,
    classes,
    subjects,
    attendanceToday: attendance,
    fees,
    revenue: rev,
    expenses,
    payroll,
    admissions,
    library,
    upcomingEvents: events,
    notices,
    lowAttendance: low,
    generatedAt: new Date(),
  };
}

module.exports = {
  dashboard,
  studentStats,
  attendanceToday,
  attendanceTrend,
  feeStats,
  revenue,
  expenseStats,
  payrollStats,
  admissionStats,
  libraryStats,
  lowAttendance,
  upcomingEvents,
  recentNotices,
};
