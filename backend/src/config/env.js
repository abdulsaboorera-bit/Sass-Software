"use strict";

require("dotenv").config();

/**
 * Central, validated view of environment configuration.
 * Every other module reads config from here rather than touching
 * process.env directly, so defaults live in exactly one place.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  port: parseInt(process.env.PORT || "4000", 10),

  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexus_saas",

  jwt: {
    secret: process.env.JWT_SECRET || "nexussoft-dev-secret-change-in-production",
    issuer: process.env.JWT_ISSUER || "nexussoft",
    accessAudience: process.env.JWT_ACCESS_AUDIENCE || "nexussoft-api",
    refreshAudience: process.env.JWT_REFRESH_AUDIENCE || "nexussoft-refresh",
    accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  },

  cron: {
    enabled: (process.env.ENABLE_CRON || "true") === "true",
    tz: process.env.CRON_TZ || "Asia/Karachi",
    secret: process.env.CRON_SECRET || "change-this-cron-secret",
  },

  demoPassword: process.env.DEMO_PASSWORD || "password123",
};

const DEFAULT_JWT_SECRET = "nexussoft-dev-secret-change-in-production";
const DEFAULT_CRON_SECRET = "change-this-cron-secret";

if (env.isProd) {
  if (!process.env.JWT_SECRET || env.jwt.secret === DEFAULT_JWT_SECRET || env.jwt.secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production");
  }
  if (env.cron.enabled && (!process.env.CRON_SECRET || env.cron.secret === DEFAULT_CRON_SECRET || env.cron.secret.length < 16)) {
    throw new Error("CRON_SECRET must be set to a random value in production when cron is enabled");
  }
}

module.exports = env;
