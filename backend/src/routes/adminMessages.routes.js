"use strict";

const express = require("express");
const ctrl = require("../controllers/message.controller");

const router = express.Router();

router.get("/", ctrl.adminInbox);
router.get("/:tenantId", ctrl.adminThread);
router.post("/:tenantId", ctrl.adminSend);

module.exports = router;
