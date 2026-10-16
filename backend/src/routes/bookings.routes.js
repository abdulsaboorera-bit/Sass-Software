"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/bookings.controller");

const router = express.Router();

// Any authenticated tenant user can triage incoming booking/lead requests.
router.use(requireAuth, requireTenant);
router.get("/", asyncHandler(ctrl.list));
router.patch("/:id", asyncHandler(ctrl.update));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
