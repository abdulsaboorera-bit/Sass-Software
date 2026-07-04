"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const bodyMeasurementSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },

    weight: { type: Number },
    bodyFat: { type: Number },
    chest: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    arms: { type: Number },

    recordedAt: { type: Date, default: Date.now },
  },
  baseOptions
);

bodyMeasurementSchema.index({ memberId: 1, recordedAt: -1 });

module.exports =
  mongoose.models.BodyMeasurement || mongoose.model("BodyMeasurement", bodyMeasurementSchema);
