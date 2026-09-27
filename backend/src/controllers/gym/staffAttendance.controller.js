"use strict";

const { z } = require("zod");
const staffAttendanceService = require("../../services/gym/staffAttendance.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const markSchema = z.object({
  staffId: z.string().min(1),
  date: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
  notes: z.string().optional(),
});

function ym(req) {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
  return { year, month };
}

const mark = asyncHandler(async (req, res) => {
  const data = markSchema.parse(req.body);
  const record = await staffAttendanceService.markAttendance({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { attendance: record }, 201);
});

const listByDate = asyncHandler(async (req, res) => {
  const result = await staffAttendanceService.listByDate({ tenantId: req.tenantId, date: req.query.date });
  return apiSuccess(res, result);
});

const monthlySummary = asyncHandler(async (req, res) => {
  const result = await staffAttendanceService.monthlySummary({
    tenantId: req.tenantId,
    staffId: req.params.id,
    ...ym(req),
  });
  return apiSuccess(res, result);
});

module.exports = { mark, listByDate, monthlySummary };
