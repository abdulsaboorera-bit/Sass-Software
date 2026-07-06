"use strict";

const mongoose = require("mongoose");
const { CheckIn, Member, GymPayment } = require("../../models");
const { startOfDay, addDays } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Peak-hours heatmap from check-in timestamps over the last `days` days.
 * Returns a day-of-week x hour grid plus the busiest slot.
 */
async function peakHours({ tenantId, days = 90 }) {
  const from = startOfDay(addDays(new Date(), -(days - 1)));
  const rows = await CheckIn.aggregate([
    { $match: { tenantId: oid(tenantId), checkInTime: { $gte: from } } },
    {
      $group: {
        _id: { dow: { $dayOfWeek: "$checkInTime" }, hour: { $hour: "$checkInTime" } },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, dow: { $subtract: ["$_id.dow", 1] }, hour: "$_id.hour", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const busiest = rows[0]
    ? { day: DOW[rows[0].dow], hour: rows[0].hour, count: rows[0].count }
    : null;

  const byHour = {};
  const byDay = {};
  for (const r of rows) {
    byHour[r.hour] = (byHour[r.hour] || 0) + r.count;
    byDay[DOW[r.dow]] = (byDay[DOW[r.dow]] || 0) + r.count;
  }

  return { days, heatmap: rows.map((r) => ({ day: DOW[r.dow], dow: r.dow, hour: r.hour, count: r.count })), byHour, byDay, busiest };
}

/** Churn / retention snapshot. */
async function churn({ tenantId }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [active, expiredThisMonth, newThisMonth, frozen] = await Promise.all([
    Member.countDocuments({ tenantId, status: "ACTIVE", endDate: { $gte: now } }),
    Member.countDocuments({ tenantId, status: { $in: ["ACTIVE", "EXPIRED"] }, endDate: { $gte: monthStart, $lt: now } }),
    Member.countDocuments({ tenantId, createdAt: { $gte: monthStart } }),
    Member.countDocuments({ tenantId, status: "FROZEN" }),
  ]);

  const base = active + expiredThisMonth;
  const churnRate = base ? +((expiredThisMonth / base) * 100).toFixed(1) : 0;

  return {
    activeMembers: active,
    expiredThisMonth,
    newThisMonth,
    frozenMembers: frozen,
    churnRate,
    retentionRate: +(100 - churnRate).toFixed(1),
    netGrowthThisMonth: newThisMonth - expiredThisMonth,
  };
}

/** Revenue forecast from the last `months` months (moving average + linear trend). */
async function revenueForecast({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const rows = await GymPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: from } } },
    { $group: { _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
    { $project: { _id: 0, label: { $concat: [{ $toString: "$_id.y" }, "-", { $toString: "$_id.m" }] }, total: 1 } },
  ]);

  const totals = rows.map((r) => r.total);
  const n = totals.length;
  const avg = n ? totals.reduce((a, b) => a + b, 0) / n : 0;
  // Simple linear trend: average step between consecutive months.
  const trend = n >= 2 ? (totals[n - 1] - totals[0]) / (n - 1) : 0;
  const forecastNextMonth = Math.max(0, Math.round((n ? totals[n - 1] : 0) + trend));

  return {
    history: rows,
    average: Math.round(avg),
    trendPerMonth: Math.round(trend),
    forecastNextMonth,
    method: "moving-average + linear trend",
  };
}

module.exports = { peakHours, churn, revenueForecast };
