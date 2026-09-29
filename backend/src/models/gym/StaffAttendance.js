"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const staffAttendanceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true, index: true },

    // Local calendar day (YYYY-MM-DD). One status per staff member per day.
    dayKey: { type: String, required: true },

    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true },
    notes: { type: String },
  },
  baseOptions
);

staffAttendanceSchema.index({ tenantId: 1, staffId: 1, dayKey: 1 }, { unique: true });
staffAttendanceSchema.index({ tenantId: 1, dayKey: 1, status: 1 });

module.exports = mongoose.models.StaffAttendance || mongoose.model("StaffAttendance", staffAttendanceSchema);
