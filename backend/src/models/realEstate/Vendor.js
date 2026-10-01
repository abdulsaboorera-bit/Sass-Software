"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const vendorSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true, trim: true },
  serviceType: { type: String, enum: ["PLUMBING", "ELECTRICAL", "CLEANING", "HVAC", "SECURITY", "GENERAL", "OTHER"], default: "GENERAL" },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

vendorSchema.index({ tenantId: 1, name: 1 }, { unique: true });
vendorSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
