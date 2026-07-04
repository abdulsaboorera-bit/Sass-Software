"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    industry: {
      type: String,
      required: true,
      enum: ["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP"],
      index: true,
    },
    plan: {
      type: String,
      enum: ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"],
      default: "TRIAL",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },

    trialEndsAt: { type: Date },
    stripeCustomerId: { type: String },
    subscriptionId: { type: String },

    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
  },
  baseOptions
);

module.exports = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);
