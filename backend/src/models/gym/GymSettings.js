"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const operatingHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: "06:00" },
    close: { type: String, default: "22:00" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const gymSettingsSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
    gymName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    operatingHours: [operatingHoursSchema],
    lateCheckInMinutes: { type: Number, default: 15 },
    autoExpireMemberships: { type: Boolean, default: true },
    enableNotifications: { type: Boolean, default: true },
    enableWhatsApp: { type: Boolean, default: false },
    enableEmail: { type: Boolean, default: false },
    enableSMS: { type: Boolean, default: false },
    reminderDaysBeforeExpiry: { type: Number, default: 3 },
    reminderDaysBeforePayment: { type: Number, default: 2 },
    lowStockThreshold: { type: Number, default: 5 },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String },
  },
  baseOptions
);

module.exports = mongoose.models.GymSettings || mongoose.model("GymSettings", gymSettingsSchema);
