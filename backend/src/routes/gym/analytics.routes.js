"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/analytics.controller");
const { requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

// Analytics is management-only. Any of these permissions grants access, so
// owners (*) and receptionists with reporting rights can view dashboards.
const canView = requireAnyPermission("analytics.view", "members.view", "fees.reports", "billing.view");

router.get("/dashboard", canView, ctrl.dashboard);
router.get("/members", canView, ctrl.members);
router.get("/revenue", canView, ctrl.revenue);
router.get("/pending-payments", canView, ctrl.pendingPayments);

module.exports = router;
