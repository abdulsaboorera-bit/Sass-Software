"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * NEW billing primitive. Previously the gym only stored bare GymPayment rows
 * (money received). An invoice represents money *owed*: it has a due date, an
 * overdue lifecycle (marked automatically by the daily cron), a human invoice
 * reference, and a running paidAmount reconciled from its GymPayments.
 */
const gymInvoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },

    invoiceRef: { type: String, required: true }, // e.g. "INV-2607-8F3A2C"

    type: {
      type: String,
      enum: ["MEMBERSHIP", "RENEWAL", "PERSONAL_TRAINING", "PRODUCT", "OTHER"],
      default: "MEMBERSHIP",
    },
    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", default: null },

    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },

    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    periodStart: { type: Date },
    periodEnd: { type: Date },
    notes: { type: String },
  },
  baseOptions
);

gymInvoiceSchema.index({ tenantId: 1, invoiceRef: 1 }, { unique: true });
gymInvoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

/** Outstanding balance for this invoice. */
gymInvoiceSchema.virtual("balance").get(function () {
  return Math.max(0, Number(this.amount) - Number(this.paidAmount || 0));
});

module.exports = mongoose.models.GymInvoice || mongoose.model("GymInvoice", gymInvoiceSchema);
