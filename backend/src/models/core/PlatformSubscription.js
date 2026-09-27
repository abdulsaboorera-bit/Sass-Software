"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * One row per subscription renewal for a tenant's platform software
 * subscription (what the tenant pays NexusSoft — unrelated to a gym's own
 * member billing). Paid-only ledger recorded by hand by the super admin;
 * a tenant's current status is derived from the row with the latest
 * periodEnd, not stored redundantly here.
 */
const platformSubscriptionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    package: { type: String, enum: ["MONTHLY", "SEMIANNUAL", "ANNUAL"], required: true },
    amount: { type: Number, required: true, min: 0 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: Date.now },
    method: { type: String },
    notes: { type: String },
  },
  baseOptions
);

platformSubscriptionSchema.index({ tenantId: 1, periodEnd: -1 });

module.exports = mongoose.models.PlatformSubscription || mongoose.model("PlatformSubscription", platformSubscriptionSchema);
