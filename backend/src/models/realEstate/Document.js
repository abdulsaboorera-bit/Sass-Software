"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const documentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  title: { type: String, required: true, trim: true },
  docType: { type: String, enum: ["DEED", "LEASE_AGREEMENT", "IDENTITY", "RECEIPT", "INVOICE", "OTHER"], default: "OTHER" },
  url: { type: String, required: true, trim: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", index: true },
  unitId: { type: Schema.Types.ObjectId, ref: "PropertyUnit", index: true },
  expiresAt: { type: Date },
  notes: { type: String },
}, baseOptions);

documentSchema.index({ tenantId: 1, createdAt: -1 });
documentSchema.index({ tenantId: 1, propertyId: 1, createdAt: -1 });

module.exports = mongoose.models.PropertyDocument || mongoose.model("PropertyDocument", documentSchema);
