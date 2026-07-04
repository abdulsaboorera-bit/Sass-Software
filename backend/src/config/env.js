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

module.exports = env;
