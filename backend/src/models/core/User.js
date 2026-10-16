"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", default: null, index: true },

    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },

    role: { type: String, enum: ["SUPER_ADMIN", "SUPPORT_AGENT"], default: "SUPER_ADMIN" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "INVITED"], default: "ACTIVE" },
    lastLoginAt: { type: Date },

    // ── Two-factor authentication (TOTP) ───────────────────
    twoFactorEnabled: { type: Boolean, default: false },
    // Confirmed secret (base32). `select: false` so it never leaks in JSON.
    twoFactorSecret: { type: String, select: false },
    // Temporary secret during enrollment, promoted on first valid code.
    twoFactorPendingSecret: { type: String, select: false },
    // One-time recovery codes (bcrypt hashes) issued at enrollment.
    twoFactorRecoveryCodes: { type: [String], default: undefined, select: false },
  },
  baseOptions
);

// Login is email-only, so email must be globally unique to avoid ambiguous
// authentication across tenants.
userSchema.index({ email: 1 }, { unique: true });

// Never leak the password hash through JSON serialisation.
userSchema.set("toJSON", {
  ...baseOptions.toJSON,
  transform(doc, ret) {
    baseOptions.toJSON.transform(doc, ret);
    delete ret.passwordHash;
    delete ret.twoFactorSecret;
    delete ret.twoFactorPendingSecret;
    delete ret.twoFactorRecoveryCodes;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
