"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const unitSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  unitNo: { type: String, required: true, trim: true, uppercase: true },
  floor: { type: Number, min: -5, max: 200 },
  type: { type: String, enum: ["APARTMENT", "SHOP", "OFFICE", "HOUSE", "ROOM", "OTHER"], default: "APARTMENT" },
  bedrooms: { type: Number, min: 0, max: 50 },
  bathrooms: { type: Number, min: 0, max: 50 },
  areaSqft: { type: Number, min: 0 },
  rentAmount: { type: Number, min: 0, required: true },
  status: { type: String, enum: ["VACANT", "OCCUPIED", "MAINTENANCE", "NOT_AVAILABLE"], default: "VACANT", index: true },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

unitSchema.index({ tenantId: 1, propertyId: 1, unitNo: 1 }, { unique: true });
unitSchema.index({ tenantId: 1, status: 1, isActive: 1 });
unitSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.PropertyUnit || mongoose.model("PropertyUnit", unitSchema);
