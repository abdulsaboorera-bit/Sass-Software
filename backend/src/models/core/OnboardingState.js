"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * Tracks a tenant's first-run setup progress so the dashboard can show the
 * onboarding wizard until the owner completes (or dismisses) it.
 */
const onboardingStateSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date },
    seededDemo: { type: Boolean, default: false },
    steps: { type: [String], default: [] },
  },
  baseOptions
);

module.exports = mongoose.models.OnboardingState || mongoose.model("OnboardingState", onboardingStateSchema);
