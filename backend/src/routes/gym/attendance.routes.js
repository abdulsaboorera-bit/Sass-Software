"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/attendance.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

router.post("/check-in", requireAnyPermission("attendance.mark", "attendance.create"), ctrl.checkIn);
router.post("/check-out", requireAnyPermission("attendance.mark", "attendance.edit"), ctrl.checkOut);

router.get("/", requirePermission("attendance.view"), ctrl.list);
router.get("/summary", requirePermission("attendance.view"), ctrl.monthlySummary);
router.get("/trends", requirePermission("attendance.view"), ctrl.trends);
router.get("/members/:id/summary", requirePermission("attendance.view"), ctrl.memberMonthlySummary);

module.exports = router;
