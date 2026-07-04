"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const tenantUserSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: "TenantRole", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

// Give TenantUser.populate("role") the same ergonomics the code relied on.
tenantUserSchema.virtual("role", {
  ref: "TenantRole",
  localField: "roleId",
  foreignField: "_id",
  justOne: true,
});

tenantUserSchema.index({ tenantId: 1, userId: 1, roleId: 1 }, { unique: true });

module.exports = mongoose.models.TenantUser || mongoose.model("TenantUser", tenantUserSchema);
