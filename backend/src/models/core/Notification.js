"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * Persisted, channel-agnostic notification. The notification service writes
 * these rows for every triggered event; delivery adapters (WhatsApp, email,
 * SMS) later pick up rows where `status = "PENDING"` and flip them to SENT/FAILED.
 * No real provider is wired yet — this is the queue/outbox they will read.
 */
const notificationSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    // Event that produced this notification.
    event: {
      type: String,
      required: true,
      enum: [
        "MEMBERSHIP_EXPIRING_SOON",
        "MEMBERSHIP_EXPIRED",
        "PAYMENT_DUE",
        "PAYMENT_OVERDUE",
        "MISSED_ATTENDANCE",
        "WELCOME",
        "GENERIC",
      ],
      index: true,
    },

    // Intended delivery channel(s). Structured now so adapters can be added later.
    channel: {
      type: String,
      enum: ["WHATSAPP", "EMAIL", "SMS", "IN_APP"],
      default: "IN_APP",
    },

    // Loose recipient reference so this table works for any module.
    recipientType: { type: String, default: "MEMBER" }, // MEMBER | USER | CUSTOM
    recipientId: { type: Schema.Types.ObjectId, index: true },
    recipientName: { type: String },
    recipientContact: { type: String }, // phone/email captured at trigger time

    title: { type: String, required: true },
    message: { type: String, required: true },
    // Arbitrary event payload (memberId, invoiceId, daysLeft, ...).
    data: { type: Schema.Types.Mixed },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "SKIPPED"],
      default: "PENDING",
      index: true,
    },
    sentAt: { type: Date },
    error: { type: String },

    // Idempotency guard so the daily cron doesn't re-create the same
    // "expiring in 3 days" notice on every run. (Unique partial index below.)
    dedupeKey: { type: String },
  },
  baseOptions
);

notificationSchema.index({ tenantId: 1, event: 1, createdAt: -1 });
// Partial unique index: when a dedupeKey is supplied it must be unique.
notificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
