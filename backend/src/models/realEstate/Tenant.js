"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const leaseTenantSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  nationalId: { type: String, trim: true },
  address: { type: String },
  emergencyContact: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

leaseTenantSchema.index({ tenantId: 1, name: 1 });
leaseTenantSchema.index({ tenantId: 1, phone: 1 });
leaseTenantSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.LeaseTenant || mongoose.model("LeaseTenant", leaseTenantSchema);
