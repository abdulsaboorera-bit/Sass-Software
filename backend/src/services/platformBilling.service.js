"use strict";

const { Tenant, PlatformSubscription } = require("../models");
const { ApiError } = require("../utils/apiResponse");
const { addDays } = require("../utils/dates");
const { PLANS } = require("../config/plans");

const DUE_SOON_DAYS = 7;

/** Derive a tenant's current subscription status from their latest row. */
function statusFor(latest, now = new Date()) {
  if (!latest) return "NEVER_PAID";
  if (latest.periodEnd < now) return "OVERDUE";
  if (latest.periodEnd < addDays(now, DUE_SOON_DAYS)) return "DUE_SOON";
  return "ACTIVE";
}

/** Record a payment: server computes amount/periodEnd from the package, ignoring any client-sent amount. */
async function recordPayment({ tenantId, package: pkg, method, notes }) {
  const plan = PLANS[pkg];
  if (!plan) throw ApiError.badRequest("Invalid package");

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw ApiError.notFound("Tenant not found");

  // Renewals stack onto the current period if still active; otherwise start from now.
  const latest = await PlatformSubscription.findOne({ tenantId }).sort({ periodEnd: -1 });
  const now = new Date();
  const periodStart = latest && latest.periodEnd > now ? latest.periodEnd : now;
  const periodEnd = addDays(periodStart, plan.days);

  return PlatformSubscription.create({
    tenantId,
    package: pkg,
    amount: plan.amount,
    periodStart,
    periodEnd,
    paidAt: now,
    method,
    notes,
  });
}

/** Every tenant with its derived subscription status, for the payments dashboard. */
async function listAll() {
  const tenants = await Tenant.find().select("name slug industry status").sort({ name: 1 }).lean();
  const latestRows = await PlatformSubscription.aggregate([
    { $sort: { periodEnd: -1 } },
    { $group: { _id: "$tenantId", periodEnd: { $first: "$periodEnd" }, periodStart: { $first: "$periodStart" }, package: { $first: "$package" }, amount: { $first: "$amount" }, paidAt: { $first: "$paidAt" } } },
  ]);
  const byTenant = new Map(latestRows.map((r) => [String(r._id), r]));

  const now = new Date();
  return tenants.map((t) => {
    const latest = byTenant.get(String(t._id)) || null;
    return {
      tenant: { id: String(t._id), name: t.name, slug: t.slug, industry: t.industry },
      package: latest ? latest.package : null,
      periodEnd: latest ? latest.periodEnd : null,
      paidAt: latest ? latest.paidAt : null,
      status: statusFor(latest, now),
    };
  });
}

/** History of payments for one tenant. */
async function history({ tenantId }) {
  return PlatformSubscription.find({ tenantId }).sort({ periodEnd: -1 }).lean();
}

module.exports = { recordPayment, listAll, history, statusFor };
