"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const trainerScheduleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, enum: ["SESSION", "CLASS", "AVAILABILITY", "BREAK"], default: "SESSION" },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"], default: "SCHEDULED" },
    notes: { type: String },
  },
  baseOptions
);

trainerScheduleSchema.index({ tenantId: 1, trainerId: 1, date: 1 });

module.exports = mongoose.models.TrainerSchedule || mongoose.model("TrainerSchedule", trainerScheduleSchema);
