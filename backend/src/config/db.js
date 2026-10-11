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
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Reuse a warm pool of connections instead of paying a handshake per request,
    // and compress the wire protocol (Atlas supports zlib) to shrink payloads.
    maxPoolSize: 50,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    compressors: ["zlib"],
    retryWrites: true,
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
