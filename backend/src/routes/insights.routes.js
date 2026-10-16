"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/insights.controller");

const router = express.Router();

// Read-only summary of the tenant's own data — available to any signed-in member.
router.use(requireAuth, requireTenant);

router.get("/", asyncHandler(ctrl.overview));

module.exports = router;
