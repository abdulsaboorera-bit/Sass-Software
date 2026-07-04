"use strict";

const mongoose = require("mongoose");
const env = require("./env");

/**
 * Connect to MongoDB. Idempotent — safe to call from the server
 * entrypoint, the seed script, and the standalone cron runner.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("[db] MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProd, // build indexes automatically in dev only
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
