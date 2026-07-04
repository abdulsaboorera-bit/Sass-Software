"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    category: { type: String, enum: ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"], default: "CASH" },
    reference: { type: String },
    recurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"] },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], default: "APPROVED" },
    notes: { type: String },
  },
  baseOptions
);

expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
