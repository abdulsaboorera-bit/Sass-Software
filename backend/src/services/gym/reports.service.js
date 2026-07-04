"use strict";

const mongoose = require("mongoose");
const { Member, GymPayment, GymInvoice, CheckIn, GymInventoryItem, Expense, Trainer, Session } = require("../../models");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function membershipReport({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  const [statusCounts, planCounts, newMembers] = await Promise.all([
    Member.aggregate([
      { $match: { tenantId: oid(tenantId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Member.aggregate([
      { $match: { tenantId: oid(tenantId) } },
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
  if (from || to) {
    match.checkInTime = {};
    if (from) match.checkInTime.$gte = new Date(from);
    if (to) match.checkInTime.$lte = new Date(to);
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
  const since = new Date();
  since.setMonth(since.getMonth() - months);
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
      { $match: { tenantId: oid(tenantId), date: { $gte: since } } },
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
  const expMap = new Map(expenses.map((e) => [`${e._id.year}-${e._id.month}`, e]));
  const series = revenue.map((r) => {
    const key = `${r._id.year}-${r._id.month}`;
    const exp = expMap.get(key);
    return {
      year: r._id.year,
      month: r._id.month,
      revenue: r.revenue,
      expenses: exp?.expenses || 0,
      profit: r.revenue - (exp?.expenses || 0),
    };
  });
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
      return { id: t.id, name: t.name, specialization: t.specialization, fee: t.fee, memberCount, activeMembers, sessions };
    })
  );
  return results;
}

async function profitLoss({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const [incomeAgg, expenseAgg] = await Promise.all([
    GymPayment.aggregate([
      { $match: { tenantId: oid(tenantId), ...(match.date ? { paidAt: match.date } : {}) } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: match },
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
