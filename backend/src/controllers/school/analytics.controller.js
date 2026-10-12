"use strict";

const analyticsService = require("../../services/school/analytics.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const result = await analyticsService.dashboard({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const students = asyncHandler(async (req, res) => {
  const result = await analyticsService.studentStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const attendance = asyncHandler(async (req, res) => {
  const result = await analyticsService.attendanceToday({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const attendanceTrend = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  const result = await analyticsService.attendanceTrend({ tenantId: req.tenantId, days });
  return apiSuccess(res, result);
});

const fees = asyncHandler(async (req, res) => {
  const result = await analyticsService.feeStats({ tenantId: req.tenantId, month: req.query.month });
  return apiSuccess(res, result);
});

const revenue = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
  const result = await analyticsService.revenue({ tenantId: req.tenantId, months });
  return apiSuccess(res, result);
});

const expenses = asyncHandler(async (req, res) => {
  const result = await analyticsService.expenseStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const payroll = asyncHandler(async (req, res) => {
  const result = await analyticsService.payrollStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const admissions = asyncHandler(async (req, res) => {
  const result = await analyticsService.admissionStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const library = asyncHandler(async (req, res) => {
  const result = await analyticsService.libraryStats({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const lowAttendance = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const result = await analyticsService.lowAttendance({ tenantId: req.tenantId, limit });
  return apiSuccess(res, result);
});

const upcomingEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const events = await analyticsService.upcomingEvents({ tenantId: req.tenantId, limit });
  return apiSuccess(res, { events });
});

const notices = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const rows = await analyticsService.recentNotices({ tenantId: req.tenantId, limit });
  return apiSuccess(res, { notices: rows });
});

module.exports = {
  dashboard,
  students,
  attendance,
  attendanceTrend,
  fees,
  revenue,
  expenses,
  payroll,
  admissions,
  library,
  lowAttendance,
  upcomingEvents,
  notices,
};
