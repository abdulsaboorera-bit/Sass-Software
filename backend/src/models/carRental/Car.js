"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const carSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  registrationNo: { type: String, required: true, trim: true, uppercase: true },
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, min: 1900, max: 2200, required: true },
  color: { type: String, trim: true },
  category: { type: String, enum: ["ECONOMY", "COMPACT", "SEDAN", "SUV", "LUXURY", "VAN", "OTHER"], default: "OTHER" },
  transmission: { type: String, enum: ["MANUAL", "AUTOMATIC", "OTHER"], default: "AUTOMATIC" },
  fuelType: { type: String, enum: ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"], default: "PETROL" },
  seats: { type: Number, min: 1, max: 50, default: 5 },
  dailyRate: { type: Number, min: 0, required: true },
  weeklyRate: { type: Number, min: 0, default: 0 },
  depositAmount: { type: Number, min: 0, default: 0 },
  mileage: { type: Number, min: 0, default: 0 },
  pictures: { type: [String], default: [] },
  status: { type: String, enum: ["AVAILABLE", "RENTED", "NOT_AVAILABLE", "WORKSHOP"], default: "AVAILABLE", index: true },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, baseOptions);

carSchema.index({ tenantId: 1, registrationNo: 1 }, { unique: true });
carSchema.index({ tenantId: 1, status: 1, isActive: 1 });
carSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.Car || mongoose.model("Car", carSchema);
