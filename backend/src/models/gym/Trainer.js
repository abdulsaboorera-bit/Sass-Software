"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const trainerSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    specialization: { type: String },
    fee: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },

    // NEW: optional link to a login user so a trainer can sign in and see
    // only their own assigned members (trainer-scoped RBAC).
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    // NEW: soft capacity used by workload metrics / assignment guardrails.
    maxMembers: { type: Number, default: 0 }, // 0 = unlimited
  },
  baseOptions
);

// Members assigned to this trainer (reverse side of Member.trainerId).
trainerSchema.virtual("assignedMembers", {
  ref: "Member",
  localField: "_id",
  foreignField: "trainerId",
});

module.exports = mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);
