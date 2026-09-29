"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const customerSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  licenseNumber: { type: String, required: true, trim: true, uppercase: true },
  licenseExpiry: { type: Date },
  nationalId: { type: String, trim: true },
  address: { type: String },
  emergencyContact: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

customerSchema.index({ tenantId: 1, licenseNumber: 1 }, { unique: true });
customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.RentalCustomer || mongoose.model("RentalCustomer", customerSchema);
