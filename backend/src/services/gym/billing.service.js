"use strict";

const { GymInvoice, GymPayment, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { startOfDay, endOfDay } = require("../../utils/dates");
const notifications = require("../notification.service");

/** Create an invoice with a unique human reference; emits a PAYMENT_DUE event. */
async function createInvoice({ tenantId, memberId, type = "MEMBERSHIP", planId, amount, dueDate, periodStart, periodEnd, notes }) {
  const member = await Member.findOne({ _id: memberId, tenantId });
  if (!member) throw ApiError.notFound("Member not found");
  if (amount == null || Number(amount) < 0) throw ApiError.badRequest("A valid amount is required");

  // Retry a couple of times in the (rare) event of a ref collision.
  let invoice;
  for (let attempt = 0; attempt < 3 && !invoice; attempt += 1) {
    try {
      invoice = await GymInvoice.create({
        tenantId,
        memberId,
        invoiceRef: invoiceRef("INV"),
        type,
        planId: planId || null,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        periodStart,
        periodEnd,
        notes,
        status: "PENDING",
      });
    } catch (err) {
      if (err && err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }

  await notifications.paymentDue(invoice, member);
  return invoice;
}

async function listInvoices({ tenantId, memberId, status, from, to, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (memberId) filter.memberId = memberId;
  if (status) filter.status = status;
  if (from || to) {
    filter.dueDate = {};
    if (from) filter.dueDate.$gte = startOfDay(new Date(from));
    if (to) filter.dueDate.$lte = endOfDay(new Date(to));
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    GymInvoice.find(filter).populate("memberId", "name memberNo phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GymInvoice.countDocuments(filter),
  ]);
  return { invoices: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getInvoice({ tenantId, id }) {
  const invoice = await GymInvoice.findOne({ _id: id, tenantId }).populate("memberId", "name memberNo phone").lean();
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const payments = await GymPayment.find({ tenantId, invoiceId: id }).sort({ paidAt: -1 }).lean();
  return { ...invoice, payments };
}

/**
 * Record a payment. If tied to an invoice, reconciles paidAmount + status
 * (PAID / PARTIAL) and stamps paidAt when fully settled.
 */
async function recordPayment({ tenantId, invoiceId, memberId, amount, method, reference, type, paidAt }) {
  if (amount == null || Number(amount) <= 0) throw ApiError.badRequest("A valid amount is required");

  let invoice = null;
  if (invoiceId) {
    invoice = await GymInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    memberId = invoice.memberId;
  }
  if (!memberId) throw ApiError.badRequest("memberId or invoiceId is required");

  const member = await Member.findOne({ _id: memberId, tenantId }).select("_id").lean();
  if (!member) throw ApiError.notFound("Member not found");

  const payment = await GymPayment.create({
    tenantId,
    memberId,
    invoiceId: invoiceId || null,
    amount: Number(amount),
    method,
    reference,
    type: type || (invoice ? invoice.type : "MEMBERSHIP"),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });

  if (invoice) {
    invoice.paidAmount = Number(invoice.paidAmount || 0) + Number(amount);
    if (invoice.paidAmount >= Number(invoice.amount)) {
      invoice.status = "PAID";
      invoice.paidAt = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.status = "PARTIAL";
    }
    await invoice.save();
  }

  return { payment: payment.toObject(), invoice: invoice ? invoice.toObject() : null };
}

async function cancelInvoice({ tenantId, id }) {
  const invoice = await GymInvoice.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!invoice) throw ApiError.notFound("Open invoice not found");
  return invoice;
}

/**
 * Mark every unpaid invoice past its due date as OVERDUE and emit a
 * PAYMENT_OVERDUE event for each. Idempotent — run daily by the cron.
 * Scope to a tenant by passing tenantId, or run platform-wide.
 */
async function markOverdue({ tenantId, now = new Date() } = {}) {
  const filter = { status: { $in: ["PENDING", "PARTIAL"] }, dueDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;

  const due = await GymInvoice.find(filter).populate("memberId", "name phone tenantId").lean();
  if (!due.length) return { marked: 0 };

  await GymInvoice.updateMany(
    { _id: { $in: due.map((d) => d._id) } },
    { $set: { status: "OVERDUE" } }
  );

  for (const inv of due) {
    await notifications.paymentOverdue(inv, inv.memberId);
  }
  return { marked: due.length };
}

/** Full payment history for a member. */
async function memberPayments({ tenantId, memberId }) {
  return GymPayment.find({ tenantId, memberId }).sort({ paidAt: -1 }).lean();
}

module.exports = {
  createInvoice,
  listInvoices,
  getInvoice,
  recordPayment,
  cancelInvoice,
  markOverdue,
  memberPayments,
};
