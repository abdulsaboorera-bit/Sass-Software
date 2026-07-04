"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/notification.controller");
const { requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

const canView = requireAnyPermission("notifications.view", "members.view", "settings.view");
const canManage = requireAnyPermission("notifications.manage", "settings.edit");

router.get("/", canView, ctrl.list);
router.post("/dispatch", canManage, ctrl.dispatch);

module.exports = router;
