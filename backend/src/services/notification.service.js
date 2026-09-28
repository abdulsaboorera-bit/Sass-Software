"use strict";

const { Notification } = require("../models");

/**
 * Notification service layer.
 *
 * This is deliberately provider-agnostic. Every triggered event is written to
 * the `Notification` collection (an outbox). Delivery is handled by pluggable
 * "channel adapters" registered below. Today only a no-op `log` adapter exists;
 * WhatsApp / email / SMS adapters can be dropped in later by calling
 * `registerAdapter("WHATSAPP", fn)` — no caller code changes.
 *
 * Flow:  emit*()  ->  create Notification(status=PENDING)
 *        dispatchPending()  ->  run adapter  ->  mark SENT / FAILED
 */

// ── Channel adapter registry ─────────────────────────────
const adapters = {
  // Default adapter: logs to stdout. Returns { ok: true } so rows are marked SENT.
  IN_APP: async () => ({ ok: true }),
  LOG: async (n) => {
    console.log(`[notify] (${n.event}) -> ${n.recipientName || n.recipientContact}: ${n.message}`);
    return { ok: true };
  },
};

/** Register/replace a delivery adapter for a channel (e.g. WhatsApp later). */
function registerAdapter(channel, fn) {
  adapters[channel] = fn;
}

// ── Core emit ────────────────────────────────────────────
/**
 * Create a notification row. If `dedupeKey` is supplied and a row with that key
 * already exists, this is a no-op (returns null) — so the daily cron can run
 * repeatedly without spamming the same "expiring soon" notice.
 */
async function emit(payload) {
  const { dedupeKey } = payload;
  if (dedupeKey) {
    const existing = await Notification.findOne({ dedupeKey }).select("_id").lean();
    if (existing) return null;
  }
  try {
    return await Notification.create({ status: "PENDING", ...payload });
  } catch (err) {
    // Duplicate dedupeKey race — safe to ignore.
    if (err && err.code === 11000) return null;
    throw err;
  }
}

// ── Event helpers (the "event-based triggers" the task asks for) ──
function membershipExpiringSoon(member, daysLeft) {
  return emit({
    tenantId: member.tenantId,
    event: "MEMBERSHIP_EXPIRING_SOON",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: member._id || member.id,
    recipientName: member.name,
    recipientContact: member.phone,
    title: "Membership expiring soon",
    message: `Hi ${member.name}, your gym membership expires in ${daysLeft} day(s). Please renew to avoid interruption.`,
    data: { memberId: String(member._id || member.id), daysLeft },
    dedupeKey: `expsoon:${member._id || member.id}:${member.endDate ? new Date(member.endDate).toISOString().slice(0, 10) : "na"}`,
  });
}

function membershipExpired(member) {
  return emit({
    tenantId: member.tenantId,
    event: "MEMBERSHIP_EXPIRED",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: member._id || member.id,
    recipientName: member.name,
    recipientContact: member.phone,
    title: "Membership expired",
    message: `Hi ${member.name}, your gym membership has expired. Renew now to keep training with us.`,
    data: { memberId: String(member._id || member.id) },
    dedupeKey: `expired:${member._id || member.id}:${member.endDate ? new Date(member.endDate).toISOString().slice(0, 10) : "na"}`,
  });
}

function paymentDue(invoice, member) {
  return emit({
    tenantId: invoice.tenantId,
    event: "PAYMENT_DUE",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: invoice.memberId,
    recipientName: member ? member.name : undefined,
    recipientContact: member ? member.phone : undefined,
    title: "Payment due",
    message: `Invoice ${invoice.invoiceRef} of amount ${invoice.amount} is due on ${new Date(invoice.dueDate).toDateString()}.`,
    data: { invoiceId: String(invoice._id || invoice.id), invoiceRef: invoice.invoiceRef },
    dedupeKey: `due:${invoice._id || invoice.id}`,
  });
}

function paymentOverdue(invoice, member) {
  return emit({
    tenantId: invoice.tenantId,
    event: "PAYMENT_OVERDUE",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: invoice.memberId,
    recipientName: member ? member.name : undefined,
    recipientContact: member ? member.phone : undefined,
    title: "Payment overdue",
    message: `Invoice ${invoice.invoiceRef} of amount ${invoice.amount} is overdue. Please clear it at your earliest.`,
    data: { invoiceId: String(invoice._id || invoice.id), invoiceRef: invoice.invoiceRef },
    dedupeKey: `overdue:${invoice._id || invoice.id}:${new Date(invoice.dueDate).toISOString().slice(0, 10)}`,
  });
}

function missedAttendance(member, days) {
  return emit({
    tenantId: member.tenantId,
    event: "MISSED_ATTENDANCE",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: member._id || member.id,
    recipientName: member.name,
    recipientContact: member.phone,
    title: "We miss you!",
    message: `Hi ${member.name}, we haven't seen you at the gym for ${days} days. Come back and keep your streak alive!`,
    data: { memberId: String(member._id || member.id), missedDays: days },
    dedupeKey: `missed:${member._id || member.id}:${new Date().toISOString().slice(0, 10)}`,
  });
}

// ── Delivery ─────────────────────────────────────────────
/**
 * Attempt delivery of pending notifications. Called by the cron after events
 * are emitted, or manually. Returns counts. No real network calls happen until
 * a channel adapter is registered.
 */
async function dispatchPending({ tenantId, limit = 200 } = {}) {
  const filter = { status: "PENDING" };
  if (tenantId) filter.tenantId = tenantId;

  const pending = await Notification.find(filter).limit(limit);
  let sent = 0;
  let failed = 0;

  for (const n of pending) {
    const adapter = adapters[n.channel];
    try {
      if (!adapter) {
        n.status = "FAILED";
        n.error = `No adapter registered for ${n.channel}`;
        failed += 1;
        await n.save();
        continue;
      }
      const result = await adapter(n);
      if (result && result.ok) {
        n.status = "SENT";
        n.sentAt = new Date();
        sent += 1;
      } else {
        n.status = "FAILED";
        n.error = (result && result.error) || "Adapter returned not-ok";
        failed += 1;
      }
    } catch (err) {
      n.status = "FAILED";
      n.error = err.message;
      failed += 1;
    }
    await n.save();
  }

  return { processed: pending.length, sent, failed };
}

module.exports = {
  registerAdapter,
  emit,
  membershipExpiringSoon,
  membershipExpired,
  paymentDue,
  paymentOverdue,
  missedAttendance,
  dispatchPending,
};
