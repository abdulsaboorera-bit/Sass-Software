"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const equipmentMaintenanceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, enum: ["CARDIO", "STRENGTH", "FREE_WEIGHTS", "FUNCTIONAL", "OTHER"], default: "OTHER" },
    status: { type: String, enum: ["OPERATIONAL", "NEEDS_REPAIR", "UNDER_MAINTENANCE", "RETIRED"], default: "OPERATIONAL" },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    purchaseDate: { type: Date },
    cost: { type: Number, min: 0 },
    vendor: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

equipmentMaintenanceSchema.index({ tenantId: 1, status: 1 });
equipmentMaintenanceSchema.index({ tenantId: 1, nextMaintenanceDate: 1 });

module.exports = mongoose.models.EquipmentMaintenance || mongoose.model("EquipmentMaintenance", equipmentMaintenanceSchema);
