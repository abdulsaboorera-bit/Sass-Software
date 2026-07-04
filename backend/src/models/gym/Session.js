"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", required: true, index: true },

    name: { type: String, required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
    capacity: { type: Number, default: 20 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

sessionSchema.index({ tenantId: 1, dayOfWeek: 1 });

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);
