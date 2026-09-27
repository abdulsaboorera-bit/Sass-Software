"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/reports.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

const perms = requirePermission("analytics.view");

router.get("/membership", perms, ctrl.membershipReport);
router.get("/attendance", perms, ctrl.attendanceReport);
router.get("/revenue", perms, ctrl.revenueReport);
router.get("/trainers", perms, ctrl.trainerReport);
router.get("/profit-loss", perms, ctrl.profitLoss);
router.get("/pnl", perms, ctrl.profitLoss);

module.exports = router;
