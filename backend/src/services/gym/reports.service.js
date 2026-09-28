"use strict";

const mongoose = require("mongoose");
const { Member, GymPayment, GymInvoice, CheckIn, GymInventoryItem, Expense, Trainer, Session } = require("../../models");
const { parseDateInput } = require("../../utils/dates");
const { ApiError } = require("../../utils/apiResponse");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

function dateBounds(from, to) {
  const start = parseDateInput(from);
  const end = parseDateInput(to, true);
  if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
  if (start && end && start > end) throw ApiError.badRequest("Date range is reversed");
  return { start, end };
}

async function membershipReport({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  const bounds = dateBounds(from, to);
  if (bounds.start || bounds.end) {
    match.createdAt = {};
    if (bounds.start) match.createdAt.$gte = bounds.start;
    if (bounds.end) match.createdAt.$lte = bounds.end;
  }
  const [statusCounts, planCounts, newMembers] = await Promise.all([
    Member.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Member.aggregate([
      { $match: match },
      { $lookup: { from: "membershipplans", localField: "planId", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      { $group: { _id: "$plan.name", count: { $sum: 1 } } },
    ]),
    Member.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);
  return {
    byStatus: statusCounts.map((s) => ({ status: s._id, count: s.count })),
    byPlan: planCounts.map((p) => ({ plan: p._id, count: p.count })),
    newByMonth: newMembers.map((m) => ({ year: m._id.year, month: m._id.month, count: m.count })),
  };
}

async function attendanceReport({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  const bounds = dateBounds(from, to);
  if (bounds.start || bounds.end) {
    match.checkInTime = {};
    if (bounds.start) match.checkInTime.$gte = bounds.start;
    if (bounds.end) match.checkInTime.$lte = bounds.end;
  }
  const [dailyCounts, memberCounts, peakHours] = await Promise.all([
    CheckIn.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$dayKey",
          count: { $sum: 1 },
          uniqueMembers: { $addToSet: "$memberId" },
        },
      },
      { $project: { _id: 1, count: 1, uniqueMembers: { $size: "$uniqueMembers" } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
    CheckIn.aggregate([
      { $match: match },
      { $group: { _id: "$memberId", visits: { $sum: 1 } } },
      { $lookup: { from: "members", localField: "_id", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
      { $project: { _id: 1, visits: 1, name: "$member.name", memberNo: "$member.memberNo" } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]),
    CheckIn.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: "$checkInTime" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);
  return {
    daily: dailyCounts.map((d) => ({ date: d._id, count: d.count, uniqueMembers: d.uniqueMembers })),
    topMembers: memberCounts,
    peakHours: peakHours.map((h) => ({ hour: h._id, count: h.count })),
  };
}

async function revenueReport({ tenantId, months = 6 }) {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const [revenue, expenses, pendingAmount] = await Promise.all([
    GymPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Expense.aggregate([
       { $match: { tenantId: oid(tenantId), date: { $gte: since }, status: { $in: ["APPROVED", "PAID"] } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          expenses: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    GymInvoice.aggregate([
      { $match: { tenantId: oid(tenantId), status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } }, count: { $sum: 1 } } },
    ]),
  ]);
  const monthMap = new Map();
  for (const row of revenue) monthMap.set(`${row._id.year}-${row._id.month}`, { year: row._id.year, month: row._id.month, revenue: row.revenue, expenses: 0 });
  for (const row of expenses) {
    const key = `${row._id.year}-${row._id.month}`;
    const current = monthMap.get(key) || { year: row._id.year, month: row._id.month, revenue: 0, expenses: 0 };
    current.expenses = row.expenses;
    monthMap.set(key, current);
  }
  const series = [...monthMap.values()]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((row) => ({ ...row, profit: row.revenue - row.expenses }));
  const totalRevenue = series.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = series.reduce((s, r) => s + r.expenses, 0);
  return {
    series,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    pendingAmount: pendingAmount[0]?.total || 0,
    pendingCount: pendingAmount[0]?.count || 0,
  };
}

async function trainerReport({ tenantId }) {
  const trainers = await Trainer.find({ tenantId }).lean({ virtuals: true });
  const results = await Promise.all(
    trainers.map(async (t) => {
      const [memberCount, activeMembers, sessions] = await Promise.all([
        Member.countDocuments({ tenantId, trainerId: t._id }),
        Member.countDocuments({ tenantId, trainerId: t._id, status: "ACTIVE" }),
        Session.countDocuments({ tenantId, trainerId: t._id, isActive: true }),
      ]);
      return { id: String(t._id), name: t.name, specialization: t.specialization, fee: t.fee, memberCount, activeMembers, sessions };
    })
  );
  return results;
}

async function profitLoss({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  const bounds = dateBounds(from, to);
  if (bounds.start || bounds.end) {
    match.date = {};
    if (bounds.start) match.date.$gte = bounds.start;
    if (bounds.end) match.date.$lte = bounds.end;
  }
  const [incomeAgg, expenseAgg] = await Promise.all([
    GymPayment.aggregate([
      { $match: { tenantId: oid(tenantId), ...(match.date ? { paidAt: match.date } : {}) } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { ...match, status: { $in: ["APPROVED", "PAID"] } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);
  const totalIncome = incomeAgg.reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenseAgg.reduce((s, e) => s + e.total, 0);
  return {
    income: { breakdown: incomeAgg.map((i) => ({ type: i._id, total: i.total })), total: totalIncome },
    expenses: { breakdown: expenseAgg.map((e) => ({ category: e._id, total: e.total })), total: totalExpenses },
    netProfit: totalIncome - totalExpenses,
  };
}

module.exports = { membershipReport, attendanceReport, revenueReport, trainerReport, profitLoss };
