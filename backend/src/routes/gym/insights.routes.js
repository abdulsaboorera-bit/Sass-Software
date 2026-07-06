"use strict";

const express = require("express");
const insightsCtrl = require("../../controllers/gym/insights.controller");
const exportCtrl = require("../../controllers/gym/export.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { memberViewScope } = require("../../middleware/scope");

const router = express.Router();

const canView = requireAnyPermission("analytics.view", "members.view", "billing.view");

// Gamification
router.get("/leaderboard", requirePermission("members.view"), insightsCtrl.leaderboard);
router.get("/members/:id/badges", memberViewScope, insightsCtrl.badges);

// Analytics upgrade
router.get("/peak-hours", canView, insightsCtrl.peakHours);
router.get("/churn", canView, insightsCtrl.churn);
router.get("/revenue-forecast", canView, insightsCtrl.forecast);

// Digital membership card (QR)
router.get("/members/:id/card", memberViewScope, exportCtrl.memberCard);

// CSV exports
router.get("/export/members.csv", requirePermission("members.view"), exportCtrl.membersCsv);
router.get("/export/payments.csv", requireAnyPermission("billing.view", "members.view"), exportCtrl.paymentsCsv);
router.get("/export/attendance.csv", requireAnyPermission("attendance.view", "members.view"), exportCtrl.attendanceCsv);

// Invoice / receipt PDF
router.get("/invoices/:id/pdf", requireAnyPermission("billing.view", "members.view"), exportCtrl.invoicePdf);

module.exports = router;
