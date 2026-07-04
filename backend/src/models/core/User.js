"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", default: null, index: true },

    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },

    role: { type: String, enum: ["SUPER_ADMIN", "SUPPORT_AGENT"], default: "SUPER_ADMIN" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "INVITED"], default: "ACTIVE" },
    lastLoginAt: { type: Date },
  },
  baseOptions
);

// Email is unique per tenant (a user with the same email may exist across tenants),
// mirroring the previous @@unique([tenantId, email]).
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Never leak the password hash through JSON serialisation.
userSchema.set("toJSON", {
  ...baseOptions.toJSON,
  transform(doc, ret) {
    baseOptions.toJSON.transform(doc, ret);
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
