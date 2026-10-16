"use strict";

const PDFDocument = require("pdfkit");
const { Student, Attendance, SchoolClass, SchoolSettings } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { qrDataUrl } = require("../../utils/qr");
const { startOfDay, dayKey } = require("../../utils/dates");
const examService = require("../../services/school/exam.service");

/** GET /api/school/students/:id/qr — QR code encoding the admission number. */
const studentQr = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .select("name admissionNo")
    .lean();
  if (!student) throw ApiError.notFound("Student not found");
  const qr = await qrDataUrl(student.admissionNo);
  return apiSuccess(res, { qr, admissionNo: student.admissionNo, name: student.name });
});

/**
 * POST /api/school/attendance/scan — mark attendance from a scanned student
 * QR/barcode. Body: { admissionNo | code, status?, date? }.
 */
const scanAttendance = asyncHandler(async (req, res) => {
  const code = (req.body.admissionNo || req.body.code || "").trim();
  const status = (req.body.status || "PRESENT").toUpperCase();
  if (!code) throw ApiError.badRequest("admissionNo is required");
  const student = await Student.findOne({ tenantId: req.tenantId, admissionNo: code }).select("_id name admissionNo").lean();
  if (!student) throw ApiError.notFound("No student matches that code");

  const day = req.body.date ? startOfDay(new Date(req.body.date)) : startOfDay(new Date());
  const attendance = await Attendance.findOneAndUpdate(
    { tenantId: req.tenantId, studentId: student._id, date: day },
    { $set: { status, tenantId: req.tenantId, studentId: student._id, date: day, dayKey: dayKey(day) } },
    { upsert: true, new: true }
  ).lean();

  return apiSuccess(res, { student, attendance });
});

/** GET /api/school/exams/report-card/:studentId/pdf?examId= — printable report card. */
const reportCardPdf = asyncHandler(async (req, res) => {
  const data = await examService.reportCard({ tenantId: req.tenantId, studentId: req.params.studentId, examId: req.query.examId });
  const settings = await SchoolSettings.findOne({ tenantId: req.tenantId }).select("schoolName").lean();
  const classInfo = await SchoolClass.findById(data.student.classId).select("name section").lean().catch(() => null);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="report-card-${data.student.admissionNo || data.student._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).fillColor("#0f172a").text(settings?.schoolName || "Report Card", { align: "center" });
  doc.moveDown(0.3).fontSize(12).fillColor("#475569").text(data.exam?.name || "Exam", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(10).fillColor("#334155");
  doc.text(`Student: ${data.student.name}`);
  doc.text(`Admission No: ${data.student.admissionNo || "-"}`);
  doc.text(`Class: ${classInfo ? `${classInfo.name}${classInfo.section ? " " + classInfo.section : ""}` : "-"}`);
  doc.moveDown(0.8);

  const left = 50;
  const right = 545;
  const cols = [
    { label: "Subject", x: left, w: 200 },
    { label: "Marks", x: left + 200, w: 80 },
    { label: "Total", x: left + 280, w: 80 },
    { label: "Grade", x: left + 360, w: 70 },
    { label: "%", x: left + 430, w: 65 },
  ];
  const headerY = doc.y;
  doc.fontSize(9).fillColor("#64748b");
  cols.forEach((c) => doc.text(c.label, c.x, headerY, { width: c.w }));
  const hy = doc.y;
  doc.moveTo(left, hy).lineTo(right, hy).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.5).fillColor("#0f172a");

  (data.subjects || []).forEach((s) => {
    const y = doc.y;
    doc.text(s.subject || "-", cols[0].x, y, { width: cols[0].w });
    doc.text(String(s.marks ?? "-"), cols[1].x, y, { width: cols[1].w });
    doc.text(String(s.totalMarks ?? "-"), cols[2].x, y, { width: cols[2].w });
    doc.text(s.grade || "-", cols[3].x, y, { width: cols[3].w });
    doc.text(String(s.percent ?? "-"), cols[4].x, y, { width: cols[4].w });
    doc.moveDown(0.6);
  });

  doc.moveDown(0.6);
  doc.fontSize(11).fillColor("#0f172a");
  doc.text(`Total: ${data.obtained} / ${data.total}    Percentage: ${data.percent}%    Grade: ${data.grade}`);
  if (data.position) doc.text(`Position: ${data.position} of ${data.classSize}`);
  doc.text(`Result: ${data.passed ? "PASSED" : "FAILED"}`);
  doc.moveDown(1).fontSize(9).fillColor("#94a3b8").text(`Generated: ${new Date().toLocaleString()}`);

  doc.end();
  return null;
});

module.exports = { studentQr, scanAttendance, reportCardPdf };
