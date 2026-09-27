"use strict";

const PDFDocument = require("pdfkit");
const { Member, GymPayment, CheckIn, GymInvoice, Tenant } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { toCsv } = require("../../utils/csv");
const { qrDataUrl } = require("../../utils/qr");
const { computeMembershipStatus, parseDateInput } = require("../../utils/dates");
const billingService = require("../../services/gym/billing.service");

/** Shared date-range attendance query, decorated with each row's fee status. */
async function queryAttendance({ tenantId, from, to }) {
  const filter = { tenantId };
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
    if (start && end && start > end) throw ApiError.badRequest("Date range is reversed");
    filter.checkInTime = {};
    if (start) filter.checkInTime.$gte = start;
    if (end) filter.checkInTime.$lte = end;
  }
  const rows = await CheckIn.find(filter).populate("memberId", "name memberNo").sort({ checkInTime: -1 }).limit(5000).lean();
  const latestInvoices = await billingService.latestInvoicesByMember({
    tenantId,
    memberIds: rows.map((r) => r.memberId && r.memberId._id).filter(Boolean),
  });
  for (const r of rows) {
    r.feeStatus = r.memberId ? latestInvoices.get(String(r.memberId._id))?.status || null : null;
  }
  return rows;
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

// ── CSV exports ──────────────────────────────────────────
const membersCsv = asyncHandler(async (req, res) => {
  const rows = await Member.find({ tenantId: req.tenantId }).populate("plan", "name").sort({ createdAt: -1 }).lean();
  const csv = toCsv(rows, [
    { key: "memberNo", label: "Member No" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { label: "Plan", map: (r) => (r.plan ? r.plan.name : "") },
    { label: "Status", map: (r) => computeMembershipStatus(r) },
    { label: "Start", map: (r) => (r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "") },
    { label: "Expiry", map: (r) => (r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : "") },
  ]);
  sendCsv(res, "members.csv", csv);
});

const paymentsCsv = asyncHandler(async (req, res) => {
  const rows = await GymPayment.find({ tenantId: req.tenantId }).populate("memberId", "name memberNo").sort({ paidAt: -1 }).lean();
  const csv = toCsv(rows, [
    { label: "Date", map: (r) => new Date(r.paidAt).toISOString().slice(0, 10) },
    { label: "Member", map: (r) => (r.memberId ? r.memberId.name : "") },
    { label: "Member No", map: (r) => (r.memberId ? r.memberId.memberNo : "") },
    { key: "amount", label: "Amount" },
    { key: "method", label: "Method" },
    { key: "type", label: "Type" },
    { key: "reference", label: "Reference" },
  ]);
  sendCsv(res, "payments.csv", csv);
});

const attendanceCsv = asyncHandler(async (req, res) => {
  const rows = await queryAttendance({ tenantId: req.tenantId, from: req.query.from, to: req.query.to });
  const csv = toCsv(rows, [
    { label: "Member", map: (r) => (r.memberId ? r.memberId.name : "") },
    { label: "Member No", map: (r) => (r.memberId ? r.memberId.memberNo : "") },
    { label: "Check-in", map: (r) => new Date(r.checkInTime).toLocaleString() },
    { key: "dayKey", label: "Day" },
    { label: "Fee Status", map: (r) => r.feeStatus || "" },
  ]);
  sendCsv(res, "attendance.csv", csv);
});

const attendancePdf = asyncHandler(async (req, res) => {
  const rows = await queryAttendance({ tenantId: req.tenantId, from: req.query.from, to: req.query.to });
  const tenant = await Tenant.findById(req.tenantId).select("name").lean();

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="attendance.pdf"');
  doc.pipe(res);

  doc.fontSize(20).text(tenant ? tenant.name : "Gym", { align: "left" });
  doc.moveDown(0.3).fontSize(10).fillColor("#666").text("ATTENDANCE REPORT");
  if (req.query.from || req.query.to) {
    doc.text(`${req.query.from || "…"} to ${req.query.to || "…"}`);
  }
  doc.moveDown();

  const colX = { member: 50, memberNo: 220, checkIn: 320, fee: 450 };
  doc.fontSize(9).fillColor("#666");
  doc.text("Member", colX.member, doc.y, { continued: false });
  doc.text("Member No", colX.memberNo, doc.y - doc.currentLineHeight());
  doc.text("Check-in", colX.checkIn, doc.y - doc.currentLineHeight());
  doc.text("Fee Status", colX.fee, doc.y - doc.currentLineHeight());
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.3);

  doc.fillColor("#000").fontSize(9);
  for (const r of rows) {
    if (doc.y > 760) doc.addPage();
    const y = doc.y;
    doc.text(r.memberId ? r.memberId.name : "—", colX.member, y, { width: 160 });
    doc.text(r.memberId ? r.memberId.memberNo : "—", colX.memberNo, y, { width: 90 });
    doc.text(new Date(r.checkInTime).toLocaleString(), colX.checkIn, y, { width: 120 });
    doc.text(r.feeStatus || "—", colX.fee, y, { width: 90 });
    doc.moveDown(0.6);
  }

  if (rows.length === 0) doc.text("No check-ins in this range.");

  doc.end();
});

// ── Digital membership card (QR) ─────────────────────────
const memberCard = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, tenantId: req.tenantId, ...(req.memberScope ? { trainerId: req.memberScope } : {}) }).populate("plan", "name").lean();
  if (!member) throw ApiError.notFound("Member not found");
  const tenant = await Tenant.findById(req.tenantId).select("name logo").lean();
  const qr = await qrDataUrl(member.memberNo);
  return apiSuccess(res, {
    card: {
      gym: tenant ? tenant.name : "Gym",
      name: member.name,
      memberNo: member.memberNo,
      plan: member.plan ? member.plan.name : null,
      status: computeMembershipStatus(member),
      validUntil: member.endDate,
      photo: member.photo || null,
      qr, // data URL (PNG) encoding the memberNo — scan at the check-in kiosk
    },
  });
});

// ── Invoice / receipt PDF ────────────────────────────────
const invoicePdf = asyncHandler(async (req, res) => {
  const invoice = await GymInvoice.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate("memberId", "name memberNo phone").lean();
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const tenant = await Tenant.findById(req.tenantId).select("name currency").lean();
  const cur = tenant && tenant.currency ? tenant.currency : "PKR";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceRef}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text(tenant ? tenant.name : "Gym", { align: "left" });
  doc.moveDown(0.3).fontSize(10).fillColor("#666").text("INVOICE / RECEIPT");
  doc.moveDown();

  doc.fillColor("#000").fontSize(11);
  doc.text(`Invoice: ${invoice.invoiceRef}`);
  doc.text(`Date: ${new Date(invoice.issuedAt).toDateString()}`);
  doc.text(`Due: ${new Date(invoice.dueDate).toDateString()}`);
  doc.text(`Status: ${invoice.status}`);
  doc.moveDown();

  if (invoice.memberId) {
    doc.text(`Billed to: ${invoice.memberId.name} (${invoice.memberId.memberNo})`);
    if (invoice.memberId.phone) doc.text(`Phone: ${invoice.memberId.phone}`);
    doc.moveDown();
  }

  doc.fontSize(12).text(`${invoice.type}`, { continued: true }).text(`${cur} ${Number(invoice.amount).toLocaleString()}`, { align: "right" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#333")
    .text(`Paid: ${cur} ${Number(invoice.paidAmount || 0).toLocaleString()}`, { align: "right" })
    .text(`Balance: ${cur} ${Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0)).toLocaleString()}`, { align: "right" });

  doc.moveDown(3).fontSize(9).fillColor("#999").text("Thank you for your membership.", { align: "center" });
  doc.end();
});

module.exports = { membersCsv, paymentsCsv, attendanceCsv, attendancePdf, memberCard, invoicePdf };
