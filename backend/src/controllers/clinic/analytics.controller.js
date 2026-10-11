"use strict";

const analyticsService = require("../../services/clinic/analytics.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const result = await analyticsService.dashboard({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const patients = asyncHandler(async (req, res) => {
  const result = await analyticsService.patientStats({ tenantId: req.tenantId });
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

const topDoctors = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const result = await analyticsService.topDoctors({ tenantId: req.tenantId, limit });
  return apiSuccess(res, { topDoctors: result });
});

const inventory = asyncHandler(async (req, res) => {
  const result = await analyticsService.inventoryStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const pharmacy = asyncHandler(async (req, res) => {
  const result = await analyticsService.pharmacyStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const pendingInvoices = asyncHandler(async (req, res) => {
  const result = await analyticsService.pendingInvoices({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { dashboard, patients, appointments, revenue, topDoctors, inventory, pharmacy, pendingInvoices };
