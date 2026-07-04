"use strict";

const { Attendance } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { startOfDay, endOfDay } = require("../../utils/dates");

/** GET /api/school/attendance?classId&date&studentId -> { attendance } */
const list = asyncHandler(async (req, res) => {
  const filter = { tenantId: req.tenantId };
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.date) {
    filter.date = { $gte: startOfDay(new Date(req.query.date)), $lte: endOfDay(new Date(req.query.date)) };
  }
  const rows = await Attendance.find(filter).populate("student", "name admissionNo classId").sort({ date: -1 }).lean();
  return apiSuccess(res, { attendance: rows });
});

/**
 * POST /api/school/attendance  body: { date, records: [{ studentId, status, remarks? }] }
 * Upserts one row per (student, date). Returns { marked }.
 */
const mark = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records)) throw ApiError.badRequest("date and records[] are required");
  const day = startOfDay(new Date(date));

  const ops = records
    .filter((r) => r.studentId && r.status)
    .map((r) => ({
      updateOne: {
        filter: { tenantId: req.tenantId, studentId: r.studentId, date: day },
        update: { $set: { status: r.status, remarks: r.remarks, tenantId: req.tenantId, studentId: r.studentId, date: day } },
        upsert: true,
      },
    }));

  if (!ops.length) return apiSuccess(res, { marked: 0 });
  const result = await Attendance.bulkWrite(ops);
  const marked = (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0);
  return apiSuccess(res, { marked });
});

module.exports = { list, mark };
