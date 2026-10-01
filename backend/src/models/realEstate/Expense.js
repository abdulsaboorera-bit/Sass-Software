"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const expenseSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", index: true },
  unitId: { type: Schema.Types.ObjectId, ref: "PropertyUnit", index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
  category: { type: String, enum: ["REPAIRS", "UTILITIES", "MAINTENANCE", "TAXES", "INSURANCE", "MARKETING", "SALARIES", "OTHER"], default: "OTHER" },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String },
  notes: { type: String },
}, baseOptions);

expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, propertyId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1, date: -1 });

module.exports = mongoose.models.PropertyExpense || mongoose.model("PropertyExpense", expenseSchema);
