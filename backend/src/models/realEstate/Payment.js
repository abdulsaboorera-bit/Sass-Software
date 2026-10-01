"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const paymentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  leaseId: { type: Schema.Types.ObjectId, ref: "Lease", required: true, index: true },
  leaseTenantId: { type: Schema.Types.ObjectId, ref: "LeaseTenant", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", index: true },
  unitId: { type: Schema.Types.ObjectId, ref: "PropertyUnit", index: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"], required: true },
  reference: { type: String },
  paidAt: { type: Date, default: Date.now },
}, baseOptions);

paymentSchema.index({ tenantId: 1, leaseId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, propertyId: 1, paidAt: -1 });

module.exports = mongoose.models.RentPayment || mongoose.model("RentPayment", paymentSchema);
