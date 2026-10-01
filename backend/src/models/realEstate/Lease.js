"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const leaseSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  leaseNo: { type: String, required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  unitId: { type: Schema.Types.ObjectId, ref: "PropertyUnit", required: true, index: true },
  leaseTenantId: { type: Schema.Types.ObjectId, ref: "LeaseTenant", required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dueDay: { type: Number, min: 1, max: 31, default: 1 },
  rentAmount: { type: Number, required: true, min: 0 },
  months: { type: Number, required: true, min: 1 },
  totalBilled: { type: Number, required: true, min: 0 },
  depositAmount: { type: Number, min: 0, default: 0 },
  depositPaid: { type: Number, min: 0, default: 0 },
  amountPaid: { type: Number, min: 0, default: 0 },
  rentStatus: { type: String, enum: ["PAID", "PARTIAL", "UNPAID"], default: "UNPAID", index: true },
  status: { type: String, enum: ["PENDING", "ACTIVE", "EXPIRED", "TERMINATED"], default: "ACTIVE", index: true },
  terminatedAt: { type: Date },
  notes: { type: String },
}, baseOptions);

leaseSchema.index({ tenantId: 1, leaseNo: 1 }, { unique: true });
leaseSchema.index({ tenantId: 1, status: 1, endDate: 1 });
leaseSchema.index({ tenantId: 1, unitId: 1, createdAt: -1 });
leaseSchema.virtual("balance").get(function () { return Math.max(0, Number(this.totalBilled || 0) - Number(this.amountPaid || 0)); });

module.exports = mongoose.models.Lease || mongoose.model("Lease", leaseSchema);
