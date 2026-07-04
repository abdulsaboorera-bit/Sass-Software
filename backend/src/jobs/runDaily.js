"use strict";

/**
 * Standalone daily-job runner for external schedulers (Windows Task Scheduler,
 * cron, GitHub Actions, Kubernetes CronJob, ...). Connects, runs the pass, exits.
 *
 *   node src/jobs/runDaily.js
 */
const { connectDB, disconnectDB } = require("../config/db");
const { runGymDaily } = require("./gymDaily");

(async () => {
  try {
    await connectDB();
    const summary = await runGymDaily();
    console.log("[runDaily] done:", summary);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("[runDaily] failed:", err);
    process.exit(1);
  }
})();
