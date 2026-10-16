"use strict";

const env = require("../config/env");
const { Notification } = require("../models");
const { whatsappLink } = require("../utils/whatsapp");

/**
 * Notification service layer.
 *
 * This is deliberately provider-agnostic. Every triggered event is written to
 * the `Notification` collection (an outbox). Delivery is handled by pluggable
 * "channel adapters" registered below.
 *
 * Free delivery channels (no paid service required):
 *   - WHATSAPP: click-to-chat. We generate a wa.me deep link (status QUEUED) that
 *     staff open from their own WhatsApp; `markSent` flips it to SENT.
 *   - EMAIL:    optional HTTP provider (Resend/Brevo) via global fetch. When no
 *     key is configured the row is marked SKIPPED rather than FAILED.
 *   - IN_APP:   the bell in the app (read via `/api/notifications`).
 *
 * Flow:  emit*()  ->  create Notification(status=PENDING)
 *        dispatchPending()  ->  run adapter  ->  mark SENT/QUEUED/FAILED/SKIPPED
 */

// ── Channel adapter registry ─────────────────────────────
const adapters = {
  // In-app: nothing to deliver; it is already readable from the outbox.
  IN_APP: async () => ({ ok: true }),
  // Default console adapter.
  LOG: async (n) => {
    console.log(`[notify] (${n.event}) -> ${n.recipientName || n.recipientContact}: ${n.message}`);
    return { ok: true };
  },
  // Click-to-chat: produce a deep link, don't call any network.
  WHATSAPP: async (n) => {
    const link = n.link || whatsappLink(n.recipientContact, n.message);
    if (!link) return { skipped: true, reason: "No phone number for WhatsApp" };
    return { ok: true, queued: true, link };
  },
  // Optional email via a REST provider. No-ops (SKIPPED) when unconfigured.
  EMAIL: async (n) => sendEmail(n),
};

async function sendEmail(n) {
  const { provider, apiKey, from } = env.email;
  if (!provider || !apiKey) return { skipped: true, reason: "Email provider not configured" };
  const to = n.recipientContact;
  if (!to) return { skipped: true, reason: "No email address for recipient" };
  try {
    if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject: n.title, text: n.message }),
      });
      if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
      return { ok: true };
    }
    if (provider === "brevo") {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { email: (from.match(/<(.+)>/) || [null, from])[1] },
          to: [{ email: to }],
          subject: n.title,
          textContent: n.message,
        }),
      });
      if (!res.ok) return { ok: false, error: `Brevo ${res.status}` };
      return { ok: true };
    }
    return { skipped: true, reason: `Unknown email provider: ${provider}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

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
  // Pre-compute the click-to-chat link so it is available immediately.
  if (payload.channel === "WHATSAPP" && !payload.link) {
    payload.link = whatsappLink(payload.recipientContact, payload.message) || undefined;
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
  let queued = 0;
  let skipped = 0;

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
      if (result && result.queued) {
        n.status = "QUEUED";
        if (result.link) n.link = result.link;
        queued += 1;
      } else if (result && result.skipped) {
        n.status = "SKIPPED";
        n.error = result.reason || "Adapter skipped";
        skipped += 1;
      } else if (result && result.ok) {
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

  return { processed: pending.length, sent, queued, skipped, failed };
}

/** Mark a queued click-to-chat notification as delivered (staff clicked send). */
async function markSent(tenantId, id) {
  const n = await Notification.findOne({ _id: id, tenantId });
  if (!n) return null;
  n.status = "SENT";
  n.sentAt = new Date();
  await n.save();
  return n;
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
  markSent,
};
