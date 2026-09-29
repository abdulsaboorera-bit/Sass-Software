"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const checkInSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },

    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date, default: null },

    // NEW — local calendar day (YYYY-MM-DD). Enables the unique index below
    // that prevents a member checking in twice on the same day.
    dayKey: { type: String, required: true },

    // NEW — optional context captured at check-in.
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", default: null },
    method: { type: String, enum: ["MANUAL", "CARD", "QR", "BIOMETRIC"], default: "MANUAL" },
  },
  baseOptions
);

// One check-in per member per calendar day.
checkInSchema.index({ tenantId: 1, memberId: 1, dayKey: 1 }, { unique: true });
checkInSchema.index({ tenantId: 1, checkInTime: -1 });
checkInSchema.index({ tenantId: 1, memberId: 1, checkInTime: -1 });

module.exports = mongoose.models.CheckIn || mongoose.model("CheckIn", checkInSchema);
