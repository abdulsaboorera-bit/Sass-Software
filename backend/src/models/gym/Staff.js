"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const staffSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String }, // free text, e.g. "Front Desk", "Cleaning"
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

module.exports = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
