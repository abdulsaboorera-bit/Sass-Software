"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const trainerLeaveSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  baseOptions
);

trainerLeaveSchema.index({ tenantId: 1, trainerId: 1, startDate: 1 });

module.exports = mongoose.models.TrainerLeave || mongoose.model("TrainerLeave", trainerLeaveSchema);
