"use strict";

const PDFDocument = require("pdfkit");
const { Prescription, Patient, Doctor, LabResult, LabTest } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { qrDataUrl } = require("../../utils/qr");

/** GET /api/clinic/prescriptions/:id/qr — QR for prescription verification/data. */
const prescriptionQr = asyncHandler(async (req, res) => {
  const p = await Prescription.findOne({ _id: req.params.id, tenantId: req.tenantId }).select("diagnosis status").lean();
  if (!p) throw ApiError.notFound("Prescription not found");
  const qr = await qrDataUrl(`prescription:${req.params.id}`);
  return apiSuccess(res, { qr, id: req.params.id });
});

/** GET /api/clinic/lab-results/:id/pdf — printable lab report. */
const labResultPdf = asyncHandler(async (req, res) => {
  const lr = await LabResult.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
  if (!lr) throw ApiError.notFound("Lab result not found");
  const patient = lr.patientId ? await Patient.findById(lr.patientId).select("name patientNo").lean().catch(() => null) : null;
  const doctor = lr.doctorId ? await Doctor.findById(lr.doctorId).select("name").lean().catch(() => null) : null;
  const test = lr.testId ? await LabTest.findById(lr.testId).select("name code").lean().catch(() => null) : null;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="lab-report-${lr._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).fillColor("#0f172a").text("Lab Report", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(10).text(`Patient: ${patient?.name || "-"}`);
  doc.text(`Patient No: ${patient?.patientNo || "-"}`);
  doc.text(`Test: ${test?.name || lr.testName || "-"}`);
  doc.text(`Code: ${test?.code || "-"}`);
  doc.text(`Doctor: ${doctor?.name || "-"}`);
  doc.text(`Date: ${lr.date ? new Date(lr.date).toLocaleDateString() : new Date().toLocaleDateString()}`);
  doc.text(`Status: ${lr.status || "-"}`);
  doc.moveDown(0.8);
  doc.text("Result:", { underline: true });
  doc.moveDown(0.3);
  const resultStr = lr.result !== undefined && lr.result !== null ? (typeof lr.result === "string" ? lr.result : JSON.stringify(lr.result, null, 2)) : "-";
  doc.text(resultStr);
  if (lr.notes) { doc.moveDown(0.5); doc.text(`Notes: ${lr.notes}`); }
  doc.end();
  return null;
});

module.exports = { prescriptionQr, labResultPdf };
