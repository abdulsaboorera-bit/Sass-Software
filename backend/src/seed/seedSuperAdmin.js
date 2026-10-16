"use strict";

/**
 * Create (or reset) ONLY the platform super admin — no demo tenants, no demo data.
 * Safe to run repeatedly against production.
 *
 *   $env:MONGODB_URI="mongodb+srv://..."; $env:DEMO_PASSWORD="..."; node src/seed/seedSuperAdmin.js
 */
const { connectDB, disconnectDB } = require("../config/db");
const { User } = require("../models");
const { hashPassword } = require("../utils/password");
const env = require("../config/env");

const EMAIL = "admin@nexussoft.io";

(async () => {
  const password = env.demoPassword;
  if (!password) {
    throw new Error("DEMO_PASSWORD is not set. Set it to the password you want for the super admin.");
  }

  await connectDB();

  const passwordHash = await hashPassword(password);
  const email = String(EMAIL).toLowerCase();

  // Force a tenantless platform administrator (a stale local signup could have
  // claimed this email as a tenant owner).
  const result = await User.updateOne(
    { email },
    { $set: { name: "Super Admin", passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", tenantId: null } },
    { upsert: true }
  );

  console.log(`[super-admin] upserted=${result.upsertedCount > 0} modified=${result.modifiedCount} db=${env.mongoUri}`);
  console.log(`[super-admin] ${EMAIL} / ${password}`);
  await disconnectDB();
})().catch(async (err) => {
  console.error("[super-admin] FAILED:", err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
