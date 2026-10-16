"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");
require("../src/app");

const { Tenant, GymPayment, CheckIn } = require("../src/models");
const insights = require("../src/services/insights.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_insights_test";
const DAY_MS = 24 * 60 * 60 * 1000;
let databaseAvailable = false;
let tenant;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `insights-${Date.now()}`, name: "Insights Gym", industry: "GYM" });

    const now = Date.now();
    const memberId = new mongoose.Types.ObjectId();
    // Current window: one payment + one check-in per day for the last 10 days.
    for (let i = 0; i < 10; i += 1) {
      const at = new Date(now - i * DAY_MS);
      await GymPayment.create({ tenantId: tenant._id, memberId, amount: 1000, method: "CASH", paidAt: at });
      await CheckIn.create({
        tenantId: tenant._id,
        memberId: new mongoose.Types.ObjectId(),
        checkInTime: at,
        dayKey: at.toISOString().slice(0, 10),
      });
    }
    // A single spike well above the daily mean to exercise anomaly detection.
    await GymPayment.create({ tenantId: tenant._id, memberId, amount: 90000, method: "CASH", paidAt: new Date(now) });
    // Previous window: no data, so the current window shows a full increase.
  } catch {
    databaseAvailable = false;
    await mongoose.disconnect().catch(() => {});
  }
});

after(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

test("insights overview derives metrics, highlights, anomalies and a forecast", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");

  const result = await insights.overview({ tenantId: tenant._id, industry: "GYM", days: 30, horizon: 7 });

  assert.equal(result.industry, "GYM");
  assert.equal(result.windowDays, 30);
  assert.ok(result.metrics.length >= 2, "expected revenue and check-in metrics");

  const revenue = result.metrics.find((m) => m.key === "revenue");
  assert.ok(revenue, "revenue metric present");
  assert.equal(revenue.kind, "amount");
  assert.equal(revenue.previous, 0);
  assert.equal(revenue.current, 100000); // 10 x 1000 + the 90000 spike
  assert.equal(revenue.direction, "up");

  const checkins = result.metrics.find((m) => m.key === "checkins");
  assert.ok(checkins, "check-ins metric present");
  assert.equal(checkins.current, 10);

  assert.ok(Array.isArray(result.highlights));
  assert.ok(result.highlights.length >= 1);
  assert.ok(typeof result.highlights[0].text === "string");

  // The single large payment should register as a spike.
  assert.ok(result.anomalies.length >= 1, "expected at least one anomaly");
  assert.equal(result.anomalies[0].kind, "spike");

  assert.ok(result.forecast, "expected a forecast");
  assert.equal(result.forecast.horizonDays, 7);
  assert.equal(result.forecast.method, "linear regression");
  assert.ok(result.forecast.projectedTotal >= 0);
});

test("insights overview returns an empty-but-valid payload for an unknown industry", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const result = await insights.overview({ tenantId: tenant._id, industry: "NONE", days: 7 });
  assert.equal(result.metrics.length, 0);
  assert.equal(result.forecast, null);
  assert.deepEqual(result.highlights, []);
});
