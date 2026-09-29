"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const paymentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  rentalId: { type: Schema.Types.ObjectId, ref: "Rental", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "RentalCustomer", required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"], required: true },
  reference: { type: String },
  paidAt: { type: Date, default: Date.now },
}, baseOptions);

paymentSchema.index({ tenantId: 1, rentalId: 1, paidAt: -1 });

module.exports = mongoose.models.RentalPayment || mongoose.model("RentalPayment", paymentSchema);
