"use strict";

const mongoose = require("mongoose");
const { SalonInvoice, SalonPayment, SalonCustomer } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput } = require("../../utils/dates");

/** Create an invoice with a unique human reference ("SAL-YYMM-XXXXXX"). */
async function createInvoice({ tenantId, customerId, type = "SERVICE", appointmentId, amount, dueDate, notes }) {
  const customer = await SalonCustomer.findOne({ _id: customerId, tenantId }).select("_id").lean();
  if (!customer) throw ApiError.notFound("Customer not found");
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) < 0) throw ApiError.badRequest("A valid amount is required");
  const parsedDueDate = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(parsedDueDate.getTime())) throw ApiError.badRequest("Invalid due date");

  let invoice;
  for (let attempt = 0; attempt < 3 && !invoice; attempt += 1) {
    try {
      invoice = await SalonInvoice.create({
        tenantId,
        customerId,
        appointmentId: appointmentId || null,
        invoiceRef: invoiceRef("SAL"),
        type,
        amount: Number(amount),
        dueDate: parsedDueDate,
        status: Number(amount) === 0 ? "PAID" : "PENDING",
        paidAt: Number(amount) === 0 ? new Date() : null,
        notes,
      });
    } catch (err) {
      if (err && err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }
  return invoice;
}

async function listInvoices({ tenantId, customerId, status, from, to, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (customerId) filter.customerId = customerId;
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
    SalonInvoice.find(filter).populate("customerId", "name customerNo phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    SalonInvoice.countDocuments(filter),
  ]);
  return { invoices: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function listPayments({ tenantId, customerId, invoiceId, method, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (customerId) filter.customerId = customerId;
  if (invoiceId) filter.invoiceId = invoiceId;
  if (method) filter.method = method;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    SalonPayment.find(filter).populate("customerId", "name customerNo").sort({ paidAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    SalonPayment.countDocuments(filter),
  ]);
  return { payments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getInvoice({ tenantId, id }) {
  const invoice = await SalonInvoice.findOne({ _id: id, tenantId }).populate("customerId", "name customerNo phone").lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const payments = await SalonPayment.find({ tenantId, invoiceId: id }).sort({ paidAt: -1 }).lean();
  return { ...invoice, payments };
}

/** Record a payment; reconciles the linked invoice's paidAmount + status. */
async function recordPayment({ tenantId, invoiceId, customerId, amount, method, reference, type, paidAt }) {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) throw ApiError.badRequest("A valid amount is required");

  let invoice = null;
  const paymentAmount = Number(amount);
  if (invoiceId) {
    invoice = await SalonInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot pay a cancelled invoice");
    if (invoice.status === "PAID") throw ApiError.badRequest("Invoice is already paid");
    const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
    if (paymentAmount > balance) throw ApiError.badRequest(`Payment exceeds the outstanding balance of ${balance}`);
    if (customerId && String(customerId) !== String(invoice.customerId)) throw ApiError.badRequest("Payment customer does not match the invoice");
    customerId = invoice.customerId;
  }
  if (!customerId) throw ApiError.badRequest("customerId or invoiceId is required");

  const customer = await SalonCustomer.findOne({ _id: customerId, tenantId }).select("_id").lean();
  if (!customer) throw ApiError.notFound("Customer not found");

  const payment = await SalonPayment.create({
    tenantId,
    customerId,
    invoiceId: invoiceId || null,
    amount: paymentAmount,
    method,
    reference,
    type: type || (invoice ? invoice.type : "SERVICE"),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });

  let updatedInvoice = null;
  if (invoice) {
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid + paymentAmount;
    try {
      updatedInvoice = await SalonInvoice.findOneAndUpdate(
        { _id: invoice._id, tenantId, status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] }, paidAmount: previousPaid },
        {
          $set: { status: nextPaid >= Number(invoice.amount) ? "PAID" : "PARTIAL", paidAt: nextPaid >= Number(invoice.amount) ? new Date() : null },
          $inc: { paidAmount: paymentAmount },
        },
        { new: true }
      ).lean({ virtuals: true });
      if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another payment; please retry");
    } catch (err) {
      await SalonPayment.deleteOne({ _id: payment._id });
      throw err;
    }
  }

  return { payment: payment.toObject(), invoice: updatedInvoice };
}

async function updatePayment({ tenantId, id, data }) {
  const payment = await SalonPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (data.amount !== undefined && payment.invoiceId) throw ApiError.badRequest("Invoice payment amounts cannot be edited; delete and record a replacement payment");
  const update = { ...data };
  if (update.paidAt) update.paidAt = new Date(update.paidAt);
  return SalonPayment.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true }).lean({ virtuals: true });
}

async function deletePayment({ tenantId, id }) {
  const payment = await SalonPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");

  if (payment.invoiceId) {
    const invoice = await SalonInvoice.findOne({ _id: payment.invoiceId, tenantId });
    if (!invoice) throw ApiError.conflict("Payment invoice no longer exists");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot remove a payment from a cancelled invoice");
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid - Number(payment.amount);
    if (nextPaid < 0) throw ApiError.conflict("Invoice balance is inconsistent");
    const nextStatus = nextPaid === 0
      ? (invoice.dueDate < new Date() ? "OVERDUE" : "PENDING")
      : (invoice.dueDate < new Date() ? "OVERDUE" : "PARTIAL");
    const updatedInvoice = await SalonInvoice.findOneAndUpdate(
      { _id: invoice._id, tenantId, paidAmount: previousPaid },
      { $inc: { paidAmount: -Number(payment.amount) }, $set: { status: nextStatus, paidAt: null } },
      { new: true }
    );
    if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another request; please retry");
    try {
      await payment.deleteOne();
    } catch (err) {
      await SalonInvoice.updateOne(
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
  const invoice = await SalonInvoice.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!invoice) {
    const partial = await SalonInvoice.exists({ _id: id, tenantId, status: "PARTIAL" });
    if (partial) throw ApiError.badRequest("Cannot cancel a partially paid invoice");
    throw ApiError.notFound("Open invoice not found");
  }
  return invoice;
}

/** Mark every unpaid invoice past its due date as OVERDUE. Idempotent. */
async function markOverdue({ tenantId, now = new Date() } = {}) {
  const filter = { status: { $in: ["PENDING", "PARTIAL"] }, dueDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;
  const result = await SalonInvoice.updateMany(filter, { $set: { status: "OVERDUE" } });
  return { marked: result.modifiedCount || 0 };
}

async function customerPayments({ tenantId, customerId }) {
  return SalonPayment.find({ tenantId, customerId }).sort({ paidAt: -1 }).lean();
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
  customerPayments,
};
