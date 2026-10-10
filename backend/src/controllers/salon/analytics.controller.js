"use strict";

const analyticsService = require("../../services/salon/analytics.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const result = await analyticsService.dashboard({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const customers = asyncHandler(async (req, res) => {
  const result = await analyticsService.customerStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const appointments = asyncHandler(async (req, res) => {
  const result = await analyticsService.appointmentStats({ tenantId: req.tenantId });
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

const topServices = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const result = await analyticsService.topServices({ tenantId: req.tenantId, limit });
  return apiSuccess(res, { topServices: result });
});

const topStaff = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const result = await analyticsService.topStaff({ tenantId: req.tenantId, limit });
  return apiSuccess(res, { topStaff: result });
});

module.exports = { dashboard, customers, appointments, revenue, pendingPayments, topServices, topStaff };
