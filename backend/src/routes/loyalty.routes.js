"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requireAnyPermission } = require("../middleware/rbac");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/loyalty.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

// Reading the ledger + adjusting points requires loyalty/settings permission
// (owners hold "*", so they always pass).
const manage = requireAnyPermission("loyalty.manage", "loyalty.view", "settings.update");
router.get("/", manage, asyncHandler(ctrl.list));
router.post("/adjust", manage, asyncHandler(ctrl.adjust));

module.exports = router;
