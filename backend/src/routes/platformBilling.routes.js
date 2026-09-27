"use strict";

const express = require("express");
const ctrl = require("../controllers/platformBilling.controller");

const router = express.Router();

router.get("/plans", ctrl.plans);
router.get("/", ctrl.list);
router.get("/:tenantId/history", ctrl.history);
router.post("/", ctrl.recordPayment);

module.exports = router;
