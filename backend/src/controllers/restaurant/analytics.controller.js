"use strict";

const analytics = require("../../services/restaurant/analytics.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const result = await analytics.dashboard({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const revenue = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
  const result = await analytics.revenue({ tenantId: req.tenantId, months });
  return apiSuccess(res, result);
});

const topItems = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const result = await analytics.topItems({ tenantId: req.tenantId, limit, sinceDays: req.query.days });
  return apiSuccess(res, { topItems: result });
});

const hourlySales = asyncHandler(async (req, res) => {
  const result = await analytics.hourlySales({ tenantId: req.tenantId, days: req.query.days });
  return apiSuccess(res, { hourly: result });
});

const orderStats = asyncHandler(async (req, res) => {
  const result = await analytics.orderStats({ tenantId: req.tenantId, timezone: req.query.timezone });
  return apiSuccess(res, result);
});

const pendingInvoices = asyncHandler(async (req, res) => {
  const result = await analytics.pendingInvoices({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { dashboard, revenue, topItems, hourlySales, orderStats, pendingInvoices };