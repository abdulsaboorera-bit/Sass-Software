"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * Tenant-scoped discount coupon, usable across every vertical (restaurant,
 * salon, gym, bookshop, ...). Kept industry-agnostic so a single CRUD surface
 * and a single `validate` endpoint serve all modules.
 */
const couponSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },

    type: { type: String, enum: ["PERCENT", "FIXED"], default: "PERCENT" },
    value: { type: Number, required: true, min: 0 },

    // Guard rails.
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 }, // 0 = no cap (PERCENT)
    appliesTo: { type: String, default: "ALL" }, // ALL | service | product | category id, etc.

    // Usage limits.
    usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    perCustomerLimit: { type: Number, default: 1, min: 0 },

    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseOptions
);

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
