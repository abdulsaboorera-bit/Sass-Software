"use strict";

const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const { startScheduler } = require("./jobs/scheduler");

let server;

async function start() {
  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`[server] NexusSoft API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // In-process daily cron (can be disabled via ENABLE_CRON=false).
  startScheduler();
}

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down...`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (err) => {
  console.error("[server] unhandledRejection:", err);
});

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
