"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
    businessName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  baseOptions
);

module.exports = mongoose.models.CarRentalSettings || mongoose.model("CarRentalSettings", settingsSchema);
