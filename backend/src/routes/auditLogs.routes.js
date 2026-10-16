"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requireAnyPermission } = require("../middleware/rbac");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/auditLogs.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);
router.get("/", requireAnyPermission("audit.view", "audit.manage", "settings.update"), asyncHandler(ctrl.list));

module.exports = router;
