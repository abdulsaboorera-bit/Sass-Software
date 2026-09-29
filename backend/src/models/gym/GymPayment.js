"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const gymPaymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },

    // NEW — link a receipt to the invoice it settles (nullable for ad-hoc payments).
    invoiceId: { type: Schema.Types.ObjectId, ref: "GymInvoice", default: null, index: true },

    amount: { type: Number, required: true, min: 0 },
    type: { type: String, default: "MEMBERSHIP" }, // MEMBERSHIP | RENEWAL | PT | PRODUCT | OTHER
    method: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"],
      required: true,
    },
    reference: { type: String }, // receipt/txn reference
    paidAt: { type: Date, default: Date.now },
  },
  baseOptions
);

gymPaymentSchema.index({ tenantId: 1, paidAt: -1 });
gymPaymentSchema.index({ tenantId: 1, memberId: 1, paidAt: -1 });
gymPaymentSchema.index({ tenantId: 1, invoiceId: 1, paidAt: -1 });

module.exports = mongoose.models.GymPayment || mongoose.model("GymPayment", gymPaymentSchema);
