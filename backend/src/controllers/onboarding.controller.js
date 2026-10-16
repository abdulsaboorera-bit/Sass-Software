"use strict";

const { apiSuccess } = require("../utils/apiResponse");
const onboarding = require("../services/onboarding.service");

/** GET /api/onboarding — current tenant's setup progress. */
async function status(req, res) {
  const data = await onboarding.getStatus(req.tenantId);
  return apiSuccess(res, data);
}

/** POST /api/onboarding/complete — finish the wizard. */
async function complete(req, res) {
  const steps = Array.isArray(req.body && req.body.steps) ? req.body.steps : [];
  const data = await onboarding.complete(req.tenantId, steps);
  return apiSuccess(res, data);
}

/** POST /api/onboarding/seed-demo — populate sample data for this industry. */
async function seedDemo(req, res) {
  const data = await onboarding.seedDemo(req.tenantId);
  return apiSuccess(res, data);
}

module.exports = { status, complete, seedDemo };
