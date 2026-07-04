"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const inventoryItemSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["SUPPLEMENT", "DRINK", "MERCHANDISE", "EQUIPMENT", "OTHER"], default: "OTHER" },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, default: "pcs" },
    costPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, min: 0, default: 0 },
    minStock: { type: Number, default: 5 },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    location: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

inventoryItemSchema.index({ tenantId: 1, name: 1 });
inventoryItemSchema.index({ tenantId: 1, category: 1 });
inventoryItemSchema.index({ tenantId: 1, sku: 1 }, { sparse: true });

module.exports = mongoose.models.GymInventoryItem || mongoose.model("GymInventoryItem", inventoryItemSchema);
