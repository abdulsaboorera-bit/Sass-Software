"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * Generic public booking / lead / contact request, submitted from the public
 * per-tenant page and managed by staff. Industry-agnostic: a restaurant booking,
 * a salon appointment request, a real-estate viewing, a clinic inquiry and a
 * contact form all land here with `type` + free-form `data`.
 */
const bookingSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    type: { type: String, enum: ["BOOKING", "LEAD", "CONTACT"], default: "BOOKING", index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },

    service: { type: String, trim: true }, // e.g. "Haircut", "Table for 2", "SUV rental"
    message: { type: String, trim: true },

    preferredDate: { type: Date },
    preferredTime: { type: String },
    partySize: { type: Number, min: 0 },

    data: { type: Schema.Types.Mixed }, // arbitrary extra answers
    source: { type: String, default: "PUBLIC_PAGE" },

    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "NEW",
      index: true,
    },
    notes: { type: String },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions
);

bookingSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
