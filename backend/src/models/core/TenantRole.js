"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const tenantRoleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    // Array of permission strings, e.g. ["members.view", "billing.create"]; ["*"] = all.
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  baseOptions
);

tenantRoleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.models.TenantRole || mongoose.model("TenantRole", tenantRoleSchema);
