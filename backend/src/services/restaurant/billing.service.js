"use strict";

const mongoose = require("mongoose");
const { RestaurantInvoice, RestaurantPayment, RestaurantCustomer, Order } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput } = require("../../utils/dates");

/** Create an invoice with a unique human reference ("RST-YYMM-XXXXXX"). */
async function createInvoice({ tenantId, customerId, orderId, type = "CUSTOMER", amount, dueDate, notes }) {
  if (customerId) {
    const customer = await RestaurantCustomer.findOne({ _id: customerId, tenantId }).select("_id").lean();
    if (!customer) throw ApiError.notFound("Customer not found");
  }
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, tenantId }).select("_id").lean();
    if (!order) throw ApiError.notFound("Order not found");
  }
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) < 0) throw ApiError.badRequest("A valid amount is required");
  const parsedDueDate = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(parsedDueDate.getTime())) throw ApiError.badRequest("Invalid due date");

  let invoice;
  for (let attempt = 0; attempt < 3 && !invoice; attempt += 1) {
    try {
      invoice = await RestaurantInvoice.create({
        tenantId,
        customerId: customerId || null,
        orderId: orderId || null,
        invoiceRef: invoiceRef("RST"),
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
    RestaurantInvoice.find(filter).populate("customerId", "name customerNo phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    RestaurantInvoice.countDocuments(filter),
  ]);
  return { invoices: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function listPayments({ tenantId, customerId, orderId, method, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (customerId) filter.customerId = customerId;
  if (orderId) filter.orderId = orderId;
  if (method) filter.method = method;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    RestaurantPayment.find(filter).populate("customerId", "name customerNo").sort({ paidAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    RestaurantPayment.countDocuments(filter),
  ]);
  return { payments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getInvoice({ tenantId, id }) {
  const invoice = await RestaurantInvoice.findOne({ _id: id, tenantId }).populate("customerId", "name customerNo phone").lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const payments = await RestaurantPayment.find({ tenantId, invoiceId: id }).sort({ paidAt: -1 }).lean();
  return { ...invoice, payments };
}

/** Record a payment; reconciles the linked invoice's paidAmount + status. */
async function recordPayment({ tenantId, invoiceId, orderId, customerId, amount, method, reference, type, paidAt }) {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) throw ApiError.badRequest("A valid amount is required");
  const paymentAmount = Number(amount);

  let invoice = null;
  if (invoiceId) {
    invoice = await RestaurantInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot pay a cancelled invoice");
    if (invoice.status === "PAID") throw ApiError.badRequest("Invoice is already paid");
    const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
    if (paymentAmount > balance) throw ApiError.badRequest(`Payment exceeds the outstanding balance of ${balance}`);
    if (customerId && String(customerId) !== String(invoice.customerId || invoice._id)) throw ApiError.badRequest("Payment customer does not match the invoice");
    customerId = invoice.customerId || null;
  }
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, tenantId }).select("_id customerId orderNumber").lean();
    if (!order) throw ApiError.notFound("Order not found");
    if (!customerId) customerId = order.customerId || null;
  }
  if (!customerId && !invoiceId && !orderId) throw ApiError.badRequest("customerId, orderId or invoiceId is required");
  if (customerId) {
    const customer = await RestaurantCustomer.findOne({ _id: customerId, tenantId }).select("_id").lean();
    if (!customer) throw ApiError.notFound("Customer not found");
  }

  const payment = await RestaurantPayment.create({
    tenantId,
    customerId: customerId || null,
    orderId: orderId || null,
    invoiceId: invoiceId || null,
    amount: paymentAmount,
    method,
    reference,
    type: type || (invoice ? invoice.type : orderId ? "ORDER" : "CUSTOMER"),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });

  let updatedInvoice = null;
  if (invoice) {
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid + paymentAmount;
    try {
      updatedInvoice = await RestaurantInvoice.findOneAndUpdate(
        { _id: invoice._id, tenantId, status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] }, paidAmount: previousPaid },
        {
          $set: { status: nextPaid >= Number(invoice.amount) ? "PAID" : "PARTIAL", paidAt: nextPaid >= Number(invoice.amount) ? new Date() : null },
          $inc: { paidAmount: paymentAmount },
        },
        { new: true }
      ).lean({ virtuals: true });
      if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another payment; please retry");
    } catch (err) {
      await RestaurantPayment.deleteOne({ _id: payment._id });
      throw err;
    }
  }

  return { payment: payment.toObject(), invoice: updatedInvoice };
}

async function updatePayment({ tenantId, id, data }) {
  const payment = await RestaurantPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (data.amount !== undefined && payment.invoiceId) throw ApiError.badRequest("Invoice payment amounts cannot be edited; delete and record a replacement payment");
  const update = { ...data };
  if (update.paidAt) update.paidAt = new Date(update.paidAt);
  return RestaurantPayment.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true }).lean({ virtuals: true });
}

async function deletePayment({ tenantId, id }) {
  const payment = await RestaurantPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");

  if (payment.invoiceId) {
    const invoice = await RestaurantInvoice.findOne({ _id: payment.invoiceId, tenantId });
    if (!invoice) throw ApiError.conflict("Payment invoice no longer exists");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot remove a payment from a cancelled invoice");
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid - Number(payment.amount);
    if (nextPaid < 0) throw ApiError.conflict("Invoice balance is inconsistent");
    const nextStatus = nextPaid === 0 ? (invoice.dueDate < new Date() ? "OVERDUE" : "PENDING") : invoice.dueDate < new Date() ? "OVERDUE" : "PARTIAL";
    const updatedInvoice = await RestaurantInvoice.findOneAndUpdate(
      { _id: invoice._id, tenantId, paidAmount: previousPaid },
      { $inc: { paidAmount: -Number(payment.amount) }, $set: { status: nextStatus, paidAt: null } },
      { new: true }
    );
    if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another request; please retry");
    try {
      await payment.deleteOne();
    } catch (err) {
      await RestaurantInvoice.updateOne(
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
  const invoice = await RestaurantInvoice.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!invoice) {
    const partial = await RestaurantInvoice.exists({ _id: id, tenantId, status: "PARTIAL" });
    if (partial) throw ApiError.badRequest("Cannot cancel a partially paid invoice");
    throw ApiError.notFound("Open invoice not found");
  }
  return invoice;
}

/** Mark every unpaid invoice past its due date as OVERDUE. Idempotent. */
async function markOverdue({ tenantId, now = new Date() } = {}) {
  const filter = { status: { $in: ["PENDING", "PARTIAL"] }, dueDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;
  const result = await RestaurantInvoice.updateMany(filter, { $set: { status: "OVERDUE" } });
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