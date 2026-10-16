"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requireAnyPermission } = require("../middleware/rbac");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/coupons.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

// Validating a code is safe for any tenant user (e.g. a cashier applying a discount).
router.post("/validate", asyncHandler(ctrl.validate));

// Managing coupons requires a coupon/settings permission (owners hold "*").
const manage = requireAnyPermission("coupons.manage", "coupons.create", "settings.update");
router.get("/", manage, asyncHandler(ctrl.list));
router.post("/", manage, asyncHandler(ctrl.create));
router.patch("/:id", manage, asyncHandler(ctrl.update));
router.delete("/:id", manage, asyncHandler(ctrl.remove));
router.post("/:id/redeem", manage, asyncHandler(ctrl.redeem));

module.exports = router;
