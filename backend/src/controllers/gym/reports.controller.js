"use strict";

const reportsService = require("../../services/gym/reports.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const membershipReport = asyncHandler(async (req, res) => {
  const result = await reportsService.membershipReport({
    tenantId: req.tenantId, from: req.query.from, to: req.query.to,
  });
  return apiSuccess(res, result);
});

const attendanceReport = asyncHandler(async (req, res) => {
  const result = await reportsService.attendanceReport({
    tenantId: req.tenantId, from: req.query.from, to: req.query.to,
  });
  return apiSuccess(res, result);
});

const revenueReport = asyncHandler(async (req, res) => {
  const months = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);
  const result = await reportsService.revenueReport({ tenantId: req.tenantId, months });
  return apiSuccess(res, result);
});

const trainerReport = asyncHandler(async (req, res) => {
  const result = await reportsService.trainerReport({ tenantId: req.tenantId });
  return apiSuccess(res, { trainers: result });
});

const profitLoss = asyncHandler(async (req, res) => {
  const result = await reportsService.profitLoss({
    tenantId: req.tenantId, from: req.query.from, to: req.query.to,
  });
  return apiSuccess(res, result);
});

module.exports = { membershipReport, attendanceReport, revenueReport, trainerReport, profitLoss };
