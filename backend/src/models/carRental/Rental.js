"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const rentalSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  rentalNo: { type: String, required: true },
  carId: { type: Schema.Types.ObjectId, ref: "Car", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "RentalCustomer", required: true, index: true },
  pickupAt: { type: Date, required: true },
  dueAt: { type: Date, required: true },
  returnedAt: { type: Date },
  ratePerDay: { type: Number, required: true, min: 0 },
  days: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, default: 0 },
  tax: { type: Number, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  depositRequired: { type: Number, min: 0, default: 0 },
  depositPaid: { type: Number, min: 0, default: 0 },
  amountPaid: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["RESERVED", "ACTIVE", "COMPLETED", "CANCELLED", "OVERDUE"], default: "ACTIVE", index: true },
  pickupMileage: { type: Number, min: 0 },
  returnMileage: { type: Number, min: 0 },
  notes: { type: String },
}, baseOptions);

rentalSchema.index({ tenantId: 1, rentalNo: 1 }, { unique: true });
rentalSchema.index({ tenantId: 1, status: 1, dueAt: 1 });
rentalSchema.index({ tenantId: 1, carId: 1, pickupAt: -1 });
rentalSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });
rentalSchema.virtual("balance").get(function () { return Math.max(0, Number(this.total || 0) - Number(this.amountPaid || 0)); });

module.exports = mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
