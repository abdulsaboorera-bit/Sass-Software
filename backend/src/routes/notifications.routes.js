"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requireAnyPermission } = require("../middleware/rbac");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/notifications.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

// The staff bell: any tenant user may read their tenant's notifications.
router.get("/", asyncHandler(ctrl.list));
router.get("/unread-count", asyncHandler(ctrl.unreadCount));
router.post("/read-all", asyncHandler(ctrl.markAllRead));
router.post("/:id/read", asyncHandler(ctrl.markRead));
router.post("/:id/send", asyncHandler(ctrl.markSent));

// Managing/broadcasting requires a notification/settings permission (owners have "*").
const manage = requireAnyPermission("notifications.manage", "notifications.view", "settings.update");
router.post("/dispatch", manage, asyncHandler(ctrl.dispatch));
router.post("/", manage, asyncHandler(ctrl.create));

module.exports = router;
