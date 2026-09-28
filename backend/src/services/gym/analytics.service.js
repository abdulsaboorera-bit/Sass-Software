"use strict";

const mongoose = require("mongoose");
const { Member, GymPayment, GymInvoice, CheckIn, Session, GymInventoryItem, Expense, StaffAttendance, GymSettings } = require("../../models");
const { monthRange, dayKeyInTimezone, startOfDay, endOfDay } = require("../../utils/dates");
const attendance = require("./attendance.service");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/** Member headcount split by effective status (date-aware, cron-independent). */
async function memberStats({ tenantId }) {
  const now = new Date();
  const [row] = await Member.aggregate([
    { $match: { tenantId: oid(tenantId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        frozen: { $sum: { $cond: [{ $eq: ["$status", "FROZEN"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
        active: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $not: [{ $in: ["$status", ["FROZEN", "CANCELLED"]] }] },
                  { $gte: ["$endDate", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        expired: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $not: [{ $in: ["$status", ["FROZEN", "CANCELLED"]] }] },
                  { $lt: ["$endDate", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  const base = row || { total: 0, active: 0, expired: 0, frozen: 0, cancelled: 0 };

  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  base.newThisMonth = await Member.countDocuments({ tenantId, createdAt: { $gte: start, $lte: end } });

  const EXPIRING_DAYS = 7;
  const threshold = new Date(now.getTime() + EXPIRING_DAYS * 24 * 60 * 60 * 1000);
  base.expiringSoon = await Member.countDocuments({
    tenantId,
    status: { $nin: ["FROZEN", "CANCELLED"] },
    endDate: { $gte: now, $lte: threshold },
  });

  return base;
}

/** Monthly revenue (received payments) for the last `months` months. */
async function revenue({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await GymPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: from } } },
    {
      $group: {
        _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        label: {
          $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }],
        },
        total: 1,
        count: 1,
      },
    },
  ]);

  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [thisMonth] = await GymPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return { series: rows, currentMonth: thisMonth ? thisMonth.total : 0 };
}

/** Outstanding invoices: pending / partial / overdue counts + amounts owed. */
async function pendingPayments({ tenantId }) {
  const rows = await GymInvoice.aggregate([
    { $match: { tenantId: oid(tenantId), status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        outstanding: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } },
      },
    },
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

/** Today's check-in count. */
async function todayCheckins({ tenantId }) {
  const settings = await GymSettings.findOne({ tenantId }).select("timezone").lean();
  const today = dayKeyInTimezone(new Date(), settings?.timezone || "Asia/Karachi");
  return CheckIn.countDocuments({ tenantId, dayKey: today });
}

/** Upcoming renewals (members expiring in next N days). */
async function upcomingRenewals({ tenantId, days = 7 }) {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return Member.find({
    tenantId,
    status: { $nin: ["FROZEN", "CANCELLED"] },
    endDate: { $gte: now, $lte: threshold },
  })
    .populate("plan", "name price")
    .sort({ endDate: 1 })
    .limit(20)
    .lean({ virtuals: true });
}

/** Recent activities (latest payments, check-ins, new members). */
async function recentActivities({ tenantId, limit = 10 }) {
  const [recentPayments, recentCheckins, recentMembers] = await Promise.all([
    GymPayment.find({ tenantId })
      .populate("memberId", "name memberNo")
      .sort({ paidAt: -1 })
      .limit(limit)
      .lean({ virtuals: true }),
    CheckIn.find({ tenantId })
      .populate("memberId", "name memberNo")
      .sort({ checkInTime: -1 })
      .limit(limit)
      .lean({ virtuals: true }),
    Member.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean({ virtuals: true }),
  ]);
  return { recentPayments, recentCheckins, recentMembers };
}

/** Inventory summary for dashboard. */
async function inventoryStats({ tenantId }) {
  const [totalItems, lowStockCount, totalValue] = await Promise.all([
    GymInventoryItem.countDocuments({ tenantId, isActive: true }),
    GymInventoryItem.countDocuments({
      tenantId,
      isActive: true,
      $expr: { $lte: ["$quantity", "$minStock"] },
    }),
    GymInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
  ]);
  return { totalItems, lowStockCount, totalValue: totalValue[0]?.total || 0 };
}

/** Today's expenses total. */
async function todayExpenses({ tenantId }) {
  const now = new Date();
  const [result] = await Expense.aggregate([
    { $match: { tenantId: oid(tenantId), date: { $gte: startOfDay(now), $lte: endOfDay(now) }, status: { $in: ["APPROVED", "PAID"] } } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  return { total: result?.total || 0, count: result?.count || 0 };
}

/** One-call dashboard payload for the admin analytics screen. */
async function dashboard({ tenantId }) {
  const settings = await GymSettings.findOne({ tenantId }).select("timezone").lean();
  const today = dayKeyInTimezone(new Date(), settings?.timezone || "Asia/Karachi");
  const [members, rev, pending, attendanceTrend, staffPresentToday, todayCheckinsCount, expiringSoon, inventory, todayExp] = await Promise.all([
    memberStats({ tenantId }),
    revenue({ tenantId, months: 6 }),
    pendingPayments({ tenantId }),
    attendance.trends({ tenantId, days: 30 }),
    StaffAttendance.countDocuments({ tenantId, dayKey: today, status: { $in: ["PRESENT", "LATE"] } }),
    todayCheckins({ tenantId }),
    upcomingRenewals({ tenantId, days: 7 }),
    inventoryStats({ tenantId }),
    todayExpenses({ tenantId }),
  ]);

  return {
    members,
    revenue: rev,
    pendingPayments: pending,
    attendanceTrend,
    staffPresentToday,
    todayCheckins: todayCheckinsCount,
    expiringSoon: expiringSoon.length,
    expiringSoonMembers: expiringSoon,
    inventory,
    todayExpenses: todayExp,
    generatedAt: new Date(),
  };
}

module.exports = { memberStats, revenue, pendingPayments, dashboard, todayCheckins, upcomingRenewals, recentActivities, inventoryStats, todayExpenses };
