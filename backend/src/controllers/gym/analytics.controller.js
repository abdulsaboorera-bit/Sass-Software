"use strict";

const analyticsService = require("../../services/gym/analytics.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const result = await analyticsService.dashboard({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const members = asyncHandler(async (req, res) => {
  const result = await analyticsService.memberStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const revenue = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
  const result = await analyticsService.revenue({ tenantId: req.tenantId, months });
  return apiSuccess(res, result);
});

const pendingPayments = asyncHandler(async (req, res) => {
  const result = await analyticsService.pendingPayments({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { dashboard, members, revenue, pendingPayments };
