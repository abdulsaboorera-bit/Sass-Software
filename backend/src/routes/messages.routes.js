"use strict";

const express = require("express");
const ctrl = require("../controllers/message.controller");
const { requireAuth, requireTenant } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get("/", ctrl.tenantThread);
router.post("/", ctrl.tenantSend);
router.get("/unread", ctrl.tenantUnread);

module.exports = router;
