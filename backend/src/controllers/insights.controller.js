"use strict";

const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const insights = require("../services/insights.service");

/** GET /api/insights?days=30&horizon=7 — free deterministic insights for the tenant. */
const overview = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const horizon = parseInt(req.query.horizon, 10) || 7;
  const data = await insights.overview({
    tenantId: req.tenantId,
    industry: req.tenant.industry,
    days,
    horizon,
  });
  return apiSuccess(res, data);
});

module.exports = { overview };
