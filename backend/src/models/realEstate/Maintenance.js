"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const historySchema = new Schema({ note: String, by: String, at: { type: Date, default: Date.now } }, { _id: false });

const maintenanceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  unitId: { type: Schema.Types.ObjectId, ref: "PropertyUnit", index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM", index: true },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "OPEN", index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
  assignedTo: { type: String, trim: true },
  cost: { type: Number, min: 0, default: 0 },
  history: { type: [historySchema], default: [] },
  completedAt: { type: Date },
  notes: { type: String },
}, baseOptions);

maintenanceSchema.index({ tenantId: 1, status: 1, priority: 1 });
maintenanceSchema.index({ tenantId: 1, propertyId: 1, createdAt: -1 });
maintenanceSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.MaintenanceRequest || mongoose.model("MaintenanceRequest", maintenanceSchema);
