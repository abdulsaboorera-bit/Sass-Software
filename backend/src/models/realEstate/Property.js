"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const propertySchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  type: { type: String, enum: ["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"], default: "RESIDENTIAL" },
  description: { type: String },
  pictures: { type: [String], default: [] },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

propertySchema.index({ tenantId: 1, name: 1 }, { unique: true });
propertySchema.index({ tenantId: 1, type: 1, isActive: 1 });
propertySchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.Property || mongoose.model("Property", propertySchema);
