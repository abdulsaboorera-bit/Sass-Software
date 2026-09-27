"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const classBookingSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["BOOKED", "CHECKED_IN", "CANCELLED", "NO_SHOW"], default: "BOOKED" },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String },
    checkedInAt: { type: Date },
  },
  baseOptions
);

classBookingSchema.index(
  { tenantId: 1, sessionId: 1, date: 1, memberId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["BOOKED", "CHECKED_IN"] } } }
);

module.exports = mongoose.models.ClassBooking || mongoose.model("ClassBooking", classBookingSchema);
