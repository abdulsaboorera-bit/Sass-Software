"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const membershipPlanSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    // Duration in days (unchanged from the previous schema's `duration`).
    duration: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

module.exports =
  mongoose.models.MembershipPlan || mongoose.model("MembershipPlan", membershipPlanSchema);
