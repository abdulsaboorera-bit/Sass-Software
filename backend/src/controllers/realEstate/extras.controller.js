"use strict";

const PDFDocument = require("pdfkit");
const { Lease, PropertyUnit, LeaseTenant, RentPayment, PropertyExpense, Property } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/** GET /api/real-estate/leases/:id/pdf — e-lease summary PDF. */
const leasePdf = asyncHandler(async (req, res) => {
  const lease = await Lease.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
  if (!lease) throw ApiError.notFound("Lease not found");
  const unit = lease.unitId ? await PropertyUnit.findById(lease.unitId).select("unitNo rentAmount").lean().catch(() => null) : null;
  const tenant = lease.leaseTenantId ? await LeaseTenant.findById(lease.leaseTenantId).select("name phone").lean().catch(() => null) : null;
  const property = lease.propertyId ? await Property.findById(lease.propertyId).select("name").lean().catch(() => null) : null;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="lease-${lease.leaseNo}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).fillColor("#0f172a").text("E-Lease Summary", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(10).text(`Lease No: ${lease.leaseNo}`);
  doc.text(`Property: ${property?.name || "-"}`);
  doc.text(`Unit: ${unit?.unitNo || "-"}`);
  doc.text(`Tenant: ${tenant?.name || "-"}`);
  doc.text(`Phone: ${tenant?.phone || "-"}`);
  doc.text(`Start Date: ${lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "-"}`);
  doc.text(`End Date: ${lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "-"}`);
  doc.text(`Rent: ${lease.rentAmount}`);
  doc.text(`Deposit: ${lease.depositAmount || 0}`);
  doc.text(`Status: ${lease.status}`);
  doc.text(`Rent Status: ${lease.rentStatus}`);
  doc.end();
  return null;
});

/** GET /api/real-estate/statement?propertyId=&from=&to= — owner statement PDF (per property). */
const ownerStatementPdf = asyncHandler(async (req, res) => {
  const { propertyId, from, to } = req.query;
  const filterP = { tenantId: req.tenantId };
  if (propertyId) filterP.propertyId = propertyId;

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(String(from));
  if (to) dateFilter.$lte = new Date(String(to) + "T23:59:59Z");
  const payments = await RentPayment.find({ tenantId: req.tenantId, ...(propertyId ? { propertyId } : {}), ...(from || to ? { paidAt: dateFilter } : {}) }).lean();
  const expenses = await PropertyExpense.find({ tenantId: req.tenantId, ...(propertyId ? { propertyId } : {}), ...(from || to ? { date: dateFilter } : {}) }).lean();

  const collected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const expensesSum = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="owner-statement.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text("Owner Statement");
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Period: ${from || "-"} to ${to || "-"}`);
  doc.moveDown(0.8);
  doc.text(`Total Rent Collected: ${collected}`);
  doc.text(`Total Expenses: ${expensesSum}`);
  doc.text(`Net: ${collected - expensesSum}`);
  doc.moveDown(1);
  doc.text("Payments:", { underline: true });
  payments.slice(0, 30).forEach((p) => doc.text(`${p.amount} ${p.method} ${p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}`));
  doc.moveDown(0.5);
  doc.text("Expenses:", { underline: true });
  expenses.slice(0, 30).forEach((e) => doc.text(`${e.amount} ${e.category} ${e.date ? new Date(e.date).toLocaleDateString() : ""}`));
  doc.end();
  return null;
});

module.exports = { leasePdf, ownerStatementPdf };
