"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/search.controller");

const router = express.Router();

router.get("/", requireAuth, requireTenant, asyncHandler(ctrl.globalSearch));

module.exports = router;
