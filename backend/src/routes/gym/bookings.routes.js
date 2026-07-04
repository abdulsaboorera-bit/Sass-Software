"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/booking.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/", requirePermission("sessions.view"), ctrl.list);
router.post("/", requirePermission("sessions.create"), ctrl.create);
router.post("/:id/check-in", requirePermission("attendance.mark"), ctrl.checkIn);
router.post("/:id/cancel", requirePermission("sessions.edit"), ctrl.cancel);

module.exports = router;
