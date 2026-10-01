"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const taskSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO", index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", index: true },
  assignedTo: { type: String, trim: true },
  notes: { type: String },
}, baseOptions);

taskSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
taskSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.PropertyTask || mongoose.model("PropertyTask", taskSchema);
