"use strict";

const { z } = require("zod");
const attendanceService = require("../../services/gym/attendance.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const checkInSchema = z.object({
  memberId: z.string().min(1),
  method: z.enum(["MANUAL", "CARD", "QR", "BIOMETRIC"]).optional(),
  trainerId: z.string().optional(),
  at: z.string().optional(),
});

const checkOutSchema = z.object({
  checkInId: z.string().optional(),
  memberId: z.string().optional(),
  at: z.string().optional(),
});

function ym(req) {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
  return { year, month };
}

const checkIn = asyncHandler(async (req, res) => {
  const data = checkInSchema.parse(req.body);
  const result = await attendanceService.checkIn({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

const checkOut = asyncHandler(async (req, res) => {
  const data = checkOutSchema.parse(req.body);
  const record = await attendanceService.checkOut({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { checkIn: record });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await attendanceService.list({
    tenantId: req.tenantId,
    memberId: req.query.memberId,
    from: req.query.from,
    to: req.query.to,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const monthlySummary = asyncHandler(async (req, res) => {
  const result = await attendanceService.monthlySummary({ tenantId: req.tenantId, ...ym(req) });
  return apiSuccess(res, result);
});

const memberMonthlySummary = asyncHandler(async (req, res) => {
  const result = await attendanceService.memberMonthlySummary({
    tenantId: req.tenantId,
    memberId: req.params.id,
    ...ym(req),
  });
  return apiSuccess(res, result);
});

const trends = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  const result = await attendanceService.trends({ tenantId: req.tenantId, days });
  return apiSuccess(res, { days, trend: result });
});

module.exports = { checkIn, checkOut, list, monthlySummary, memberMonthlySummary, trends };
