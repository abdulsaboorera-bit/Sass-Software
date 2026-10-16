"use strict";

const { OnboardingState, Tenant } = require("../models");
const { seedIndustryDemo } = require("./demo.service");

/** Read (or lazily create) the onboarding state for a tenant. */
async function getStatus(tenantId) {
  let state = await OnboardingState.findOne({ tenantId }).lean();
  if (!state) {
    const created = await OnboardingState.create({ tenantId });
    state = created.toObject();
  }
  const tenant = await Tenant.findById(tenantId).select("industry name").lean();
  return {
    completed: Boolean(state.completed),
    seededDemo: Boolean(state.seededDemo),
    steps: state.steps || [],
    industry: tenant ? tenant.industry : null,
    businessName: tenant ? tenant.name : null,
  };
}

/** Mark onboarding complete (optionally recording which steps were done). */
async function complete(tenantId, steps = []) {
  const state = await OnboardingState.findOneAndUpdate(
    { tenantId },
    { $set: { completed: true, completedAt: new Date(), ...(steps.length ? { steps } : {}) } },
    { new: true, upsert: true }
  ).lean();
  return { completed: true, completedAt: state.completedAt };
}

/** Seed demo records for the tenant's industry and flag the state. */
async function seedDemo(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("industry").lean();
  if (!tenant) return { seeded: false, results: [] };
  const results = await seedIndustryDemo(tenantId, tenant.industry);
  const created = results.reduce((sum, r) => sum + (r.created || 0), 0);
  await OnboardingState.findOneAndUpdate(
    { tenantId },
    { $set: { seededDemo: created > 0 } },
    { upsert: true }
  );
  return { seeded: created > 0, created, results };
}

module.exports = { getStatus, complete, seedDemo };
