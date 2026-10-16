"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * Generic loyalty ledger. Every point earn/redeem/adjustment across any vertical
 * is appended here for a full audit trail, while the running balance also lives
 * on the customer document (`loyaltyPoints`). `customerType` records which
 * industry collection the `customerId` points at (e.g. "SALON", "RESTAURANT").
 */
const loyaltyTransactionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerType: { type: String, required: true }, // GYM | RESTAURANT | BOOKSHOP | SALON | CAR_RENTAL
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    customerName: { type: String },

    // Signed: positive = earned, negative = redeemed.
    points: { type: Number, required: true },
    balanceAfter: { type: Number },

    type: { type: String, enum: ["EARNED", "REDEEMED", "ADJUSTED"], default: "ADJUSTED" },
    reason: { type: String },
    orderRef: { type: String },
  },
  baseOptions
);

loyaltyTransactionSchema.index({ tenantId: 1, customerType: 1, customerId: 1, createdAt: -1 });

module.exports =
  mongoose.models.LoyaltyTransaction ||
  mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);
