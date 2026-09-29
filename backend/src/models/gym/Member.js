"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");
const { computeMembershipStatus } = require("../../utils/dates");

const { Schema } = mongoose;

/** A single dated note — appended, never overwritten (notes history). */
const memberNoteSchema = new Schema(
  {
    note: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/** A renewal event — full history of how a membership was extended. */
const renewalSchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan" },
    planName: { type: String },
    previousEndDate: { type: Date },
    newEndDate: { type: Date, required: true },
    amount: { type: Number, default: 0 },
    invoiceId: { type: Schema.Types.ObjectId, ref: "GymInvoice" },
    renewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    renewedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const memberSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    memberNo: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    address: { type: String },
    photo: { type: String },
    emergencyContact: { type: String },

    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", required: true },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },

    // Stored status. `ACTIVE`/`EXPIRED` are kept in sync with `endDate` by the
    // daily cron; `FROZEN`/`CANCELLED` are set explicitly by staff and are
    // date-independent. Use `effectiveStatus` for the always-correct value.
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "FROZEN", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },

    // NEW — trainer assignment (reverse of Trainer.assignedMembers).
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", default: null, index: true },

    // NEW — attendance denormalisation for fast reads + streaks.
    lastAttendanceAt: { type: Date, default: null },
    lastAttendanceDay: { type: String, default: null }, // YYYY-MM-DD key
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },

    // NEW — freeze bookkeeping.
    frozenAt: { type: Date, default: null },
    freezeReason: { type: String, default: null },

    // NEW — append-only histories (no destructive overwrites).
    notesHistory: { type: [memberNoteSchema], default: [] },
    renewals: { type: [renewalSchema], default: [] },
  },
  baseOptions
);

memberSchema.index({ tenantId: 1, memberNo: 1 }, { unique: true });
memberSchema.index({ tenantId: 1, endDate: 1 });
memberSchema.index({ tenantId: 1, createdAt: -1 });
memberSchema.index({ tenantId: 1, trainerId: 1, createdAt: -1 });

// Relation aliases the frontend reads (member.plan, member.trainer).
memberSchema.virtual("plan", { ref: "MembershipPlan", localField: "planId", foreignField: "_id", justOne: true });
memberSchema.virtual("trainer", { ref: "Trainer", localField: "trainerId", foreignField: "_id", justOne: true });

/** Always-correct status derived from stored status + expiry date. */
memberSchema.virtual("effectiveStatus").get(function () {
  return computeMembershipStatus(this);
});

/** Whole days until expiry (negative once expired). */
memberSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.endDate) return null;
  const DAY = 24 * 60 * 60 * 1000;
  return Math.ceil((new Date(this.endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY);
});

module.exports = mongoose.models.Member || mongoose.model("Member", memberSchema);
