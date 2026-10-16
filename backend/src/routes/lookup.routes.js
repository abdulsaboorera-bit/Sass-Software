"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/lookup.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

// QR generation is handy anywhere in the app (labels, cards, receipts).
router.get("/qr", asyncHandler(ctrl.makeQr));
router.get("/", asyncHandler(ctrl.findByCode));

module.exports = router;
