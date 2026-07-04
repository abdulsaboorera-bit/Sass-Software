"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const stockMovementSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "GymInventoryItem", required: true, index: true },
    type: { type: String, enum: ["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"], required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    reference: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions
);

stockMovementSchema.index({ tenantId: 1, itemId: 1, createdAt: -1 });

module.exports = mongoose.models.StockMovement || mongoose.model("StockMovement", stockMovementSchema);
