"use strict";

const { z } = require("zod");
const examService = require("../../services/school/exam.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const saveMarksSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      marks: z.number().nonnegative(),
      remarks: z.string().optional(),
      examDate: z.string().optional(),
    })
  ),
});

/** POST /api/school/exams/marks — bulk upsert marks for one exam + subject. */
const saveMarks = asyncHandler(async (req, res) => {
  const data = saveMarksSchema.parse(req.body);
  const result = await examService.saveMarks({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

/** GET /api/school/exams/report-card?studentId&examId */
const reportCard = asyncHandler(async (req, res) => {
  const result = await examService.reportCard({ tenantId: req.tenantId, studentId: req.query.studentId, examId: req.query.examId });
  return apiSuccess(res, result);
});

/** GET /api/school/exams/result-sheet?examId */
const resultSheet = asyncHandler(async (req, res) => {
  const result = await examService.resultSheet({ tenantId: req.tenantId, examId: req.query.examId });
  return apiSuccess(res, result);
});

module.exports = { saveMarks, reportCard, resultSheet };
