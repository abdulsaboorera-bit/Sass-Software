"use strict";

const mongoose = require("mongoose");
const { GymInvoice, GymPayment, Member, MembershipPlan } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput } = require("../../utils/dates");
const notifications = require("../notification.service");

/** Create an invoice with a unique human reference; emits a PAYMENT_DUE event. */
async function createInvoice({ tenantId, memberId, type = "MEMBERSHIP", planId, amount, dueDate, periodStart, periodEnd, notes }) {
  const member = await Member.findOne({ _id: memberId, tenantId });
  if (!member) throw ApiError.notFound("Member not found");
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) < 0) throw ApiError.badRequest("A valid amount is required");
  if (planId && !(await MembershipPlan.exists({ _id: planId, tenantId }))) throw ApiError.badRequest("Invalid plan");
  const parsedDueDate = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(parsedDueDate.getTime())) throw ApiError.badRequest("Invalid due date");
  if (periodStart && Number.isNaN(new Date(periodStart).getTime())) throw ApiError.badRequest("Invalid period start");
  if (periodEnd && Number.isNaN(new Date(periodEnd).getTime())) throw ApiError.badRequest("Invalid period end");
  if (periodStart && periodEnd && new Date(periodStart) > new Date(periodEnd)) throw ApiError.badRequest("Invoice period is reversed");

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
         dueDate: parsedDueDate,
        periodStart,
        periodEnd,
        notes,
         status: Number(amount) === 0 ? "PAID" : "PENDING",
         paidAt: Number(amount) === 0 ? new Date() : null,
      });
    } catch (err) {
      if (err && err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }

  if (invoice.status !== "PAID") await notifications.paymentDue(invoice, member);
  return invoice;
}

async function listInvoices({ tenantId, memberId, status, from, to, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (memberId) filter.memberId = memberId;
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
    GymInvoice.find(filter).populate("memberId", "name memberNo phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    GymInvoice.countDocuments(filter),
  ]);
  return { invoices: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function listPayments({ tenantId, memberId, invoiceId, method, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (memberId) filter.memberId = memberId;
  if (invoiceId) filter.invoiceId = invoiceId;
  if (method) filter.method = method;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    GymPayment.find(filter)
      .populate("memberId", "name memberNo")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    GymPayment.countDocuments(filter),
  ]);
  return { payments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getInvoice({ tenantId, id }) {
  const invoice = await GymInvoice.findOne({ _id: id, tenantId }).populate("memberId", "name memberNo phone").lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  const payments = await GymPayment.find({ tenantId, invoiceId: id }).sort({ paidAt: -1 }).lean();
  return { ...invoice, payments };
}

/**
 * Record a payment. If tied to an invoice, reconciles paidAmount + status
 * (PAID / PARTIAL) and stamps paidAt when fully settled.
 */
async function recordPayment({ tenantId, invoiceId, memberId, amount, method, reference, type, paidAt }) {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) throw ApiError.badRequest("A valid amount is required");

  let invoice = null;
  const paymentAmount = Number(amount);
  if (invoiceId) {
    invoice = await GymInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot pay a cancelled invoice");
    if (invoice.status === "PAID") throw ApiError.badRequest("Invoice is already paid");
    const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount || 0));
    if (paymentAmount > balance) throw ApiError.badRequest(`Payment exceeds the outstanding balance of ${balance}`);
    if (memberId && String(memberId) !== String(invoice.memberId)) {
      throw ApiError.badRequest("Payment member does not match the invoice");
    }
    memberId = invoice.memberId;
  }
  if (!memberId) throw ApiError.badRequest("memberId or invoiceId is required");

  const member = await Member.findOne({ _id: memberId, tenantId }).select("_id").lean();
  if (!member) throw ApiError.notFound("Member not found");

  const payment = await GymPayment.create({
    tenantId,
    memberId,
    invoiceId: invoiceId || null,
    amount: paymentAmount,
    method,
    reference,
    type: type || (invoice ? invoice.type : "MEMBERSHIP"),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });

  let updatedInvoice = null;
  if (invoice) {
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid + paymentAmount;
    try {
      updatedInvoice = await GymInvoice.findOneAndUpdate(
        {
          _id: invoice._id,
          tenantId,
          status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
          paidAmount: previousPaid,
        },
        {
          $set: {
            status: nextPaid >= Number(invoice.amount) ? "PAID" : "PARTIAL",
            paidAt: nextPaid >= Number(invoice.amount) ? new Date() : null,
          },
          $inc: { paidAmount: paymentAmount },
        },
        { new: true }
      ).lean({ virtuals: true });
      if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another payment; please retry");
    } catch (err) {
      await GymPayment.deleteOne({ _id: payment._id });
      throw err;
    }
  }

  return { payment: payment.toObject(), invoice: updatedInvoice };
}

async function updatePayment({ tenantId, id, data }) {
  const payment = await GymPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (data.amount !== undefined && payment.invoiceId) {
    throw ApiError.badRequest("Invoice payment amounts cannot be edited; delete and record a replacement payment");
  }
  const update = { ...data };
  if (update.paidAt) update.paidAt = new Date(update.paidAt);
  const updated = await GymPayment.findOneAndUpdate(
    { _id: id, tenantId },
    update,
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  return updated;
}

async function deletePayment({ tenantId, id }) {
  const payment = await GymPayment.findOne({ _id: id, tenantId });
  if (!payment) throw ApiError.notFound("Payment not found");

  if (payment.invoiceId) {
    const invoice = await GymInvoice.findOne({ _id: payment.invoiceId, tenantId });
    if (!invoice) throw ApiError.conflict("Payment invoice no longer exists");
    if (invoice.status === "CANCELLED") throw ApiError.badRequest("Cannot remove a payment from a cancelled invoice");
    const previousPaid = Number(invoice.paidAmount || 0);
    const nextPaid = previousPaid - Number(payment.amount);
    if (nextPaid < 0) throw ApiError.conflict("Invoice balance is inconsistent");
    const nextStatus = nextPaid === 0
      ? (invoice.dueDate < new Date() ? "OVERDUE" : "PENDING")
      : (invoice.dueDate < new Date() ? "OVERDUE" : "PARTIAL");
    const updatedInvoice = await GymInvoice.findOneAndUpdate(
      { _id: invoice._id, tenantId, paidAmount: previousPaid },
      { $inc: { paidAmount: -Number(payment.amount) }, $set: { status: nextStatus, paidAt: null } },
      { new: true }
    );
    if (!updatedInvoice) throw ApiError.conflict("Invoice was updated by another request; please retry");
    try {
      await payment.deleteOne();
    } catch (err) {
      await GymInvoice.updateOne({ _id: invoice._id, tenantId }, { $inc: { paidAmount: Number(payment.amount) }, $set: { status: invoice.status, paidAt: invoice.paidAt || null } });
      throw err;
    }
  } else {
    await payment.deleteOne();
  }
  return { success: true };
}

async function cancelInvoice({ tenantId, id }) {
  const invoice = await GymInvoice.findOneAndUpdate(
    { _id: id, tenantId, status: { $in: ["PENDING", "OVERDUE"] } },
    { status: "CANCELLED" },
    { new: true }
  ).lean();
  if (!invoice) {
    const partial = await GymInvoice.exists({ _id: id, tenantId, status: "PARTIAL" });
    if (partial) throw ApiError.badRequest("Cannot cancel a partially paid invoice");
    throw ApiError.notFound("Open invoice not found");
  }
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

  let marked = 0;
  for (const inv of due) {
    const updated = await GymInvoice.findOneAndUpdate(
      { _id: inv._id, tenantId: inv.tenantId, status: { $in: ["PENDING", "PARTIAL"] } },
      { $set: { status: "OVERDUE" } },
      { new: true }
    ).lean();
    if (!updated) continue;
    marked += 1;
    await notifications.paymentOverdue(updated, inv.memberId);
  }
  return { marked };
}

/** Full payment history for a member. */
async function memberPayments({ tenantId, memberId }) {
  return GymPayment.find({ tenantId, memberId }).sort({ paidAt: -1 }).lean();
}

/**
 * Each member's most recent invoice (by createdAt), keyed by memberId string.
 * One aggregation for however many members you need — used everywhere a
 * member-level "fee status" needs to be shown (check-in, attendance log,
 * member directory) instead of querying per member.
 */
async function latestInvoicesByMember({ tenantId, memberIds }) {
  const ids = [...new Set(memberIds.map(String))].filter(Boolean).map((id) => new mongoose.Types.ObjectId(id));
  if (!ids.length) return new Map();

  const rows = await GymInvoice.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)), memberId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$memberId",
        status: { $first: "$status" },
        amount: { $first: "$amount" },
        paidAmount: { $first: "$paidAmount" },
        dueDate: { $first: "$dueDate" },
        invoiceRef: { $first: "$invoiceRef" },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { status: r.status, amount: r.amount, paidAmount: r.paidAmount, dueDate: r.dueDate, invoiceRef: r.invoiceRef }]));
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
  memberPayments,
  latestInvoicesByMember,
};
