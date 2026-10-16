"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requireAnyPermission } = require("../middleware/rbac");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/onboarding.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get("/", asyncHandler(ctrl.status));
router.post("/complete", asyncHandler(ctrl.complete));
router.post("/seed-demo", requireAnyPermission("settings.update", "settings.manage"), asyncHandler(ctrl.seedDemo));

module.exports = router;
