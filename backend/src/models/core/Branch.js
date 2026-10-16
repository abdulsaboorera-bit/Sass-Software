"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const branchSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

branchSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.Branch || mongoose.model("Branch", branchSchema);
