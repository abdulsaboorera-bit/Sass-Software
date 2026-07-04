"use strict";

const cron = require("node-cron");
const env = require("../config/env");
const { runGymDaily } = require("./gymDaily");

let started = false;

/**
 * Start the in-process node-cron scheduler. Because this Express server is a
 * long-running process (unlike the old serverless Next.js routes), node-cron
 * fits natively. Controlled by ENABLE_CRON so it can be turned off when an
 * external scheduler drives POST /api/gym/cron/daily instead.
 */
function startScheduler() {
  if (started) return;
  if (!env.cron.enabled) {
    console.log("[cron] scheduler disabled (ENABLE_CRON=false)");
    return;
  }

  // 02:00 every day, in the configured timezone.
  cron.schedule(
    "0 2 * * *",
    async () => {
      try {
        await runGymDaily();
      } catch (err) {
        console.error("[cron] gym daily pass failed:", err.message);
      }
    },
    { timezone: env.cron.tz }
  );

  started = true;
  console.log(`[cron] scheduler started (daily 02:00 ${env.cron.tz})`);
}

module.exports = { startScheduler };
