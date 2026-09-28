"use strict";

const { connectDB, disconnectDB } = require("../config/db");
const models = require("../models");

(async () => {
  try {
    await connectDB();
    for (const [name, model] of Object.entries(models)) {
      if (!model || typeof model.syncIndexes !== "function") continue;
      await model.syncIndexes();
      console.log(`[db] indexes synchronized: ${name}`);
    }
    await disconnectDB();
  } catch (error) {
    console.error("[db] index synchronization failed:", error);
    await disconnectDB().catch(() => {});
    process.exitCode = 1;
  }
})();
