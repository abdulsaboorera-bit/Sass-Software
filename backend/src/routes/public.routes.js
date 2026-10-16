"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/public.controller");

const router = express.Router();

// Public endpoints are unauthenticated, so throttle abuse (spam form submits).
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });

router.get("/:slug/info", asyncHandler(ctrl.info));
router.get("/:slug/menu", asyncHandler(ctrl.menu));
router.get("/:slug/listings", asyncHandler(ctrl.listings));
router.post("/:slug/bookings", limiter, asyncHandler(ctrl.submit));

module.exports = router;
