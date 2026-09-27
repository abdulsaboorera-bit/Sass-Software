"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/staffAttendance.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/", requirePermission("attendance.view"), ctrl.listByDate);
router.post("/", requireAnyPermission("attendance.mark", "attendance.create"), ctrl.mark);
router.get("/staff/:id/summary", requirePermission("attendance.view"), ctrl.monthlySummary);

module.exports = router;
