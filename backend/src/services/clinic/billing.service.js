"use strict";

const { ClinicInvoice, ClinicPayment, Patient, Appointment } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput } = require("../../utils/dates");

/** Create a clinical invoice with a unique human reference ("CLN-YYMM-XXXXXX"). */
async function createInvoice({ tenantId, patientId, appointmentId, type = "CONSULTATION", amount, discount = 0, tax = 0, items = [], dueDate, notes }) {
  const patient = await Patient.findOne({ _id: patientId, tenantId }).select("_id").lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  if (appointmentId) {
    const appt = await Appointment.findOne({ _id: appointmentId, tenantId }).select("_id").lean();
    if (!appt) throw ApiError.notFound("Appointment not found");
  }
  const gross = Number(amount);
  if (!Number.isFinite(gross) || gross < 0) throw ApiError.badRequest("A valid amount is required");
  const net = Math.max(0, gross - Number(discount || 0) + Number(tax || 0));
  const parsedDueDate = dueDate ? parseDateInput(dueDate) : new Date();
  if (!parsedDueDate) throw ApiError.badRequest("Invalid due date");

  let invoice;
  for (let attempt = 0; attempt < 3 && !invoice; attempt += 1) {
    try {
      invoice = await ClinicInvoice.create({
        tenantId,
        patientId,
        appointmentId: appointmentId || null,
        invoiceRef: invoiceRef("CLN"),
        type,
        items,
        amount: net,
        discount: Number(discount || 0),
        tax: Number(tax || 0),
        dueDate: parsedDueDate,
        status: net === 0 ? "PAID" : "PENDING",
        paidAt: net === 0 ? new Date() : null,
        notes,
      });
    } catch (err) {
      if (err && err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }
  return invoice;
}

async function listInvoices({ tenantId, patientId, status, from, to, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
    if (start && end && start > end) throw ApiError.badRequest("Date range is reversed");
    filter.dueDate = {};
    if (start) filter.dueDate.$gte = start;
    if (end) filter.dueDate.$lte = end;
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    ClinicInvoice.find(filter).populate("patientId", "name patientNo phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    ClinicInvoice.countDocuments(filter),
  ]);
  return { invoices: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function listPayments({ tenantId, patientId, invoiceId, method, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (patientId) filter.patientId = patientId;
  if (invoiceId) filter.invoiceId = invoiceId;
  if (method) filter.method = method;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    ClinicPayment.find(filter).populate("patientId", "name patientNo").sort({ paidAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    ClinicPayment.countDocuments(filter),
  ]);
  return { payments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getInvoice({ tenantId, id }) {
  const invoice = await ClinicInvoice.findOne({ _id: id, tenantId }).populate("patientId", "name patientNo phone").lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const payments = await ClinicPayment.find({ tenantId, invoiceId: id }).sort({ paidAt: -1 }).lean();
  return { ...invoice, payments };
}

/** Record a payment; reconciles the linked invoice's paidAmount + status. */
async function recordPayment({ tenantId, invoiceId, patientId, amount, method, reference, type, paidAt }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw ApiError.badRequest("A valid amount is required");

  let invoice = null;
  if (invoiceId) {
    invoice = await ClinicInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot pay a cancelled invoice");
    if (invoice.status === "PAID") throw ApiError.badRequest("Invoice is already paid");
    const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
    if (value > balance) throw ApiError.badRequest(`Payment exceeds the outstanding balance of ${balance}`);
    patientId = invoice.patientId;
  }
  if (!patientId && !invoiceId) throw ApiError.badRequest("patientId or invoiceId is required");
  if (patientId) {
    const patient = await Patient.findOne({ _id: patientId, tenantId }).select("_id").lean();
    if (!patient) throw ApiError.notFound("Patient not found");
  }

  const payment = await ClinicPayment.create({
    tenantId,
    patientId,
    invoiceId: invoiceId || null,
    amount: value,
    method,
    reference,
    type: type || (invoice ? invoice.type : "CONSULTATION"),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });

  let updatedInvoice = null;
  if (invoice) {
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid + value;
    try {
      updatedInvoice = await ClinicInvoice.findOneAndUpdate(
        { _id: invoice._id, tenantId, status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] }, paidAmount: previousPaid },
        {
          $set: { status: nextPaid >= Number(invoice.amount) ? "PAID" : "PARTIAL", paidAt: nextPaid >= Number(invoice.amount) ? new Date() : null },
          $inc: { paidAmount: value },
        },
        { new: true }
      ).lean({ virtuals: true });
      if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another payment; please retry");
    } catch (err) {
      await ClinicPayment.deleteOne({ _id: payment._id });
      throw err;
    }
  }

  return { payment: payment.toObject(), invoice: updatedInvoice };
}

async function updatePayment({ tenantId, id, data }) {
  const payment = await ClinicPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (data.amount !== undefined && payment.invoiceId) throw ApiError.badRequest("Invoice payment amounts cannot be edited; delete and record a replacement payment");
  const update = { ...data };
  if (update.paidAt) update.paidAt = new Date(update.paidAt);
  return ClinicPayment.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true }).lean({ virtuals: true });
}

async function deletePayment({ tenantId, id }) {
  const payment = await ClinicPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");

  if (payment.invoiceId) {
    const invoice = await ClinicInvoice.findOne({ _id: payment.invoiceId, tenantId });
    if (!invoice) throw ApiError.conflict("Payment invoice no longer exists");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot remove a payment from a cancelled invoice");
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid - Number(payment.amount);
    if (nextPaid < 0) throw ApiError.conflict("Invoice balance is inconsistent");
    const nextStatus = nextPaid === 0 ? (invoice.dueDate < new Date() ? "OVERDUE" : "PENDING") : invoice.dueDate < new Date() ? "OVERDUE" : "PARTIAL";
    const updatedInvoice = await ClinicInvoice.findOneAndUpdate(
      { _id: invoice._id, tenantId, paidAmount: previousPaid },
      { $inc: { paidAmount: -Number(payment.amount) }, $set: { status: nextStatus, paidAt: null } },
      { new: true }
    );
    if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another request; please retry");
    try {
      await payment.deleteOne();
    } catch (err) {
      await ClinicInvoice.updateOne(
        { _id: invoice._id, tenantId },
        { $inc: { paidAmount: Number(payment.amount) }, $set: { status: invoice.status, paidAt: invoice.paidAt || null } }
      );
      throw err;
    }
  } else {
    await payment.deleteOne();
  }
  return { success: true };
}

async function cancelInvoice({ tenantId, id }) {
  const invoice = await ClinicInvoice.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!invoice) {
    const partial = await ClinicInvoice.exists({ _id: id, tenantId, status: "PARTIAL" });
    if (partial) throw ApiError.badRequest("Cannot cancel a partially paid invoice");
    throw ApiError.notFound("Open invoice not found");
  }
  return invoice;
}

/** Mark every unpaid invoice past its due date as OVERDUE. Idempotent. */
async function markOverdue({ tenantId, now = new Date() } = {}) {
  const filter = { status: { $in: ["PENDING", "PARTIAL"] }, dueDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;
  const result = await ClinicInvoice.updateMany(filter, { $set: { status: "OVERDUE" } });
  return { marked: result.modifiedCount || 0 };
}

module.exports = {
  createInvoice,
  listInvoices,
  listPayments,
  getInvoice,
  recordPayment,
  updatePayment,
  deletePayment,
  cancelInvoice,
  markOverdue,
};
