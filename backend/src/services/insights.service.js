"use strict";

const mongoose = require("mongoose");
const models = require("../models");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Deterministic "insights" engine — no LLM, no external calls.
 *
 * It reads each tenant's own transactional data, builds a daily series for
 * the current window and the equal-length window before it, then derives:
 *   - period-over-period change (with a plain-English sentence)
 *   - anomalies via z-score on the daily series
 *   - a short linear-regression forecast
 *
 * Everything here is pure aggregation + arithmetic, so it costs nothing to
 * run and can be exposed on the free tier.
 */

// ── Per-industry data sources ────────────────────────────
// `kind: "amount"` → money metric, sums a numeric field.
// `kind: "count"`  → activity metric, counts documents.
// The first source of each industry is treated as the primary metric
// (drives the forecast + anomaly detection).
const INDUSTRY_SOURCES = {
  SCHOOL: [
    { key: "fees_collected", label: "Fees collected", kind: "amount", model: "FeePayment", amountField: "netAmount", amountFallback: "amount", dateField: "paidAt", filter: { status: "PAID" } },
    { key: "attendance", label: "Attendance records", kind: "count", model: "Attendance", dateField: "date" },
    { key: "admissions", label: "New admissions", kind: "count", model: "Admission", dateField: "createdAt" },
  ],
  GYM: [
    { key: "revenue", label: "Revenue", kind: "amount", model: "GymPayment", amountField: "amount", dateField: "paidAt" },
    { key: "checkins", label: "Check-ins", kind: "count", model: "CheckIn", dateField: "checkInTime" },
  ],
  CLINIC: [
    { key: "revenue", label: "Revenue", kind: "amount", model: "ClinicPayment", amountField: "amount", dateField: "paidAt" },
    { key: "appointments", label: "Appointments", kind: "count", model: "Appointment", dateField: "date" },
  ],
  RESTAURANT: [
    { key: "sales", label: "Sales", kind: "amount", model: "Order", amountField: "total", dateField: "createdAt" },
    { key: "orders", label: "Orders", kind: "count", model: "Order", dateField: "createdAt" },
  ],
  BOOKSHOP: [
    { key: "sales", label: "Sales", kind: "amount", model: "Sale", amountField: "total", dateField: "paidAt" },
    { key: "transactions", label: "Transactions", kind: "count", model: "Sale", dateField: "paidAt" },
  ],
  CAR_RENTAL: [
    { key: "revenue", label: "Payments collected", kind: "amount", model: "RentalPayment", amountField: "amount", dateField: "paidAt" },
    { key: "rentals", label: "Rentals", kind: "count", model: "Rental", dateField: "createdAt" },
  ],
  REAL_ESTATE: [
    { key: "rent_collected", label: "Rent collected", kind: "amount", model: "RentPayment", amountField: "amount", dateField: "paidAt" },
    { key: "leases", label: "New leases", kind: "count", model: "Lease", dateField: "createdAt" },
  ],
  SALON: [
    { key: "revenue", label: "Revenue", kind: "amount", model: "SalonPayment", amountField: "amount", dateField: "paidAt" },
    { key: "appointments", label: "Appointments", kind: "count", model: "SalonAppointment", dateField: "date" },
  ],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const utcKey = (d) => new Date(d).toISOString().slice(0, 10);
const round = (n, dp = 0) => (Number.isFinite(n) ? +n.toFixed(dp) : 0);

function sumExpr(source) {
  if (source.kind === "count") return { $sum: 1 };
  if (source.amountFallback) {
    return {
      $sum: {
        $cond: [{ $gt: ["$" + source.amountField, 0] }, "$" + source.amountField, "$" + source.amountFallback],
      },
    };
  }
  return { $sum: { $ifNull: ["$" + source.amountField, 0] } };
}

/** Daily { key, value } series for a source over [from, to). */
async function dailySeries(tenantId, source, from, to) {
  const Model = models[source.model];
  if (!Model) return [];
  const match = { tenantId: oid(tenantId), [source.dateField]: { $gte: from, $lt: to } };
  if (source.filter) Object.assign(match, source.filter);

  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$" + source.dateField } }, value: sumExpr(source) } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ key: r._id, value: r.value || 0 }));
}

/** Fill missing days in [from, to) with zero so anomalies/forecast have a steady grid. */
function grid(series) {
  const map = new Map(series.map((p) => [p.key, p.value]));
  const out = [];
  const keys = [...map.keys()].sort();
  if (!keys.length) return series;
  const start = new Date(keys[0] + "T00:00:00.000Z");
  const end = new Date(keys[keys.length - 1] + "T00:00:00.000Z");
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const k = utcKey(t);
    out.push({ key: k, value: map.get(k) || 0 });
  }
  return out;
}

const totalOf = (series) => series.reduce((a, p) => a + (p.value || 0), 0);

/** Period-over-period change card. */
function buildMetric(source, current, previous, days) {
  const changePct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  const direction = changePct > 1 ? "up" : changePct < -1 ? "down" : "flat";
  const magnitude = Math.abs(changePct);

  let severity = "neutral";
  if (direction === "down") severity = magnitude >= 25 ? "critical" : magnitude >= 10 ? "warning" : "neutral";
  else if (direction === "up") severity = magnitude >= 10 ? "positive" : "neutral";

  const niceLabel = source.kind === "amount" ? source.label.toLowerCase() : source.label.toLowerCase();
  let sentence;
  if (direction === "flat") sentence = `${source.label} is steady vs the previous ${days} days`;
  else if (direction === "up") sentence = `${niceLabel} up ${round(magnitude, 1)}% vs the previous ${days} days`;
  else sentence = `${niceLabel} down ${round(magnitude, 1)}% vs the previous ${days} days`;

  return {
    key: source.key,
    label: source.label,
    kind: source.kind,
    current: round(current, source.kind === "amount" ? 0 : 0),
    previous: round(previous, source.kind === "amount" ? 0 : 0),
    changePct: round(changePct, 1),
    direction,
    severity,
    sentence,
  };
}

/** Z-score anomalies on a daily series (needs a few points and some variance). */
function detectAnomalies(series, label) {
  const values = series.map((p) => p.value);
  const n = values.length;
  if (n < 5) return [];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  if (sd <= 0) return [];
  return series
    .map((p) => ({ ...p, z: (p.value - mean) / sd }))
    .filter((p) => Math.abs(p.z) >= 2)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 3)
    .map((p) => ({ metric: label, date: p.key, value: round(p.value), zScore: round(p.z, 2), kind: p.z > 0 ? "spike" : "drop" }));
}

/** Least-squares linear regression forecast over the next `horizon` days. */
function forecast(series, label, horizon) {
  const values = series.map((p) => p.value);
  const n = values.length;
  if (n < 3) return null;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  let projected = 0;
  for (let i = 0; i < horizon; i += 1) projected += Math.max(0, intercept + slope * (n + i));
  const dailyAverage = round(projected / horizon);

  return {
    metric: label,
    horizonDays: horizon,
    projectedTotal: round(projected),
    dailyAverage,
    slopePerDay: round(slope, 2),
    direction: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
    method: "linear regression",
  };
}

/** Rank highlight sentences — biggest percentage moves first. */
function highlightsFrom(metrics) {
  return [...metrics]
    .filter((m) => m.direction !== "flat")
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 3)
    .map((m) => ({ severity: m.severity, text: m.sentence }));
}

async function overview({ tenantId, industry, days = 30, horizon = 7 }) {
  const windowDays = Math.min(180, Math.max(7, parseInt(days, 10) || 30));
  const horizonDays = Math.min(30, Math.max(1, parseInt(horizon, 10) || 7));

  const now = new Date();
  const currentFrom = new Date(now.getTime() - windowDays * DAY_MS);
  const previousFrom = new Date(now.getTime() - 2 * windowDays * DAY_MS);

  const sources = INDUSTRY_SOURCES[industry] || [];
  const metrics = [];
  let primarySeries = null;

  for (const source of sources) {
    try {
      if (!models[source.model]) continue;
      const [cur, prev] = await Promise.all([
        dailySeries(tenantId, source, currentFrom, now),
        dailySeries(tenantId, source, previousFrom, currentFrom),
      ]);
      metrics.push(buildMetric(source, totalOf(cur), totalOf(prev), windowDays));
      if (!primarySeries) primarySeries = grid(cur);
    } catch (err) {
      // A missing/incompatible model should never break the whole dashboard.
      metrics.push({
        key: source.key,
        label: source.label,
        kind: source.kind,
        current: 0,
        previous: 0,
        changePct: 0,
        direction: "flat",
        severity: "neutral",
        sentence: `${source.label} unavailable`,
      });
    }
  }

  const primary = sources[0];
  const anomalies = primary && primarySeries ? detectAnomalies(primarySeries, primary.label) : [];
  const forecastResult = primary && primarySeries ? forecast(primarySeries, primary.label, horizonDays) : null;

  return {
    industry,
    windowDays,
    generatedAt: new Date().toISOString(),
    metrics,
    highlights: highlightsFrom(metrics),
    anomalies,
    forecast: forecastResult,
  };
}

module.exports = { overview, INDUSTRY_SOURCES };
