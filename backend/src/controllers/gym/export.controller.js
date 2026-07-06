"use strict";

const PDFDocument = require("pdfkit");
const { Member, GymPayment, CheckIn, GymInvoice, Tenant } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { toCsv } = require("../../utils/csv");
const { qrDataUrl } = require("../../utils/qr");
const { computeMembershipStatus } = require("../../utils/dates");

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
  const rows = await CheckIn.find({ tenantId: req.tenantId }).populate("memberId", "name memberNo").sort({ checkInTime: -1 }).limit(5000).lean();
  const csv = toCsv(rows, [
    { label: "Member", map: (r) => (r.memberId ? r.memberId.name : "") },
    { label: "Member No", map: (r) => (r.memberId ? r.memberId.memberNo : "") },
    { label: "Check-in", map: (r) => new Date(r.checkInTime).toISOString() },
    { label: "Check-out", map: (r) => (r.checkOutTime ? new Date(r.checkOutTime).toISOString() : "") },
    { key: "dayKey", label: "Day" },
  ]);
  sendCsv(res, "attendance.csv", csv);
});

// ── Digital membership card (QR) ─────────────────────────
const memberCard = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate("plan", "name").lean();
  if (!member) throw ApiError.notFound("Member not found");
  const tenant = await Tenant.findById(req.tenantId).select("name logo").lean();
  const qr = await qrDataUrl(member.memberNo);
  return res.json({
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

module.exports = { membersCsv, paymentsCsv, attendanceCsv, memberCard, invoicePdf };
