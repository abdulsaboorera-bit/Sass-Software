"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/settings.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/", requirePermission("settings.view"), ctrl.get);
router.patch("/", requirePermission("settings.edit"), ctrl.update);

module.exports = router;
