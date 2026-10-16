"use strict";

const express = require("express");
const ctrl = require("../controllers/team.controller");
const { requireAuth, requireTenant } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");

const router = express.Router();

// Team & role management is tenant-scoped and limited to callers with the
// settings-manage permission (Owners hold the "*" wildcard; industry admins
// hold "settings.*").
router.use(requireAuth, requireTenant, requirePermission("settings.manage"));

router.get("/permissions", ctrl.permissionCatalog);

router.get("/members", ctrl.listMembers);
router.post("/members", ctrl.createMember);
router.patch("/members/:id", ctrl.updateMember);
router.delete("/members/:id", ctrl.deleteMember);

router.get("/roles", ctrl.listRoles);
router.post("/roles", ctrl.createRole);
router.patch("/roles/:id", ctrl.updateRole);
router.delete("/roles/:id", ctrl.deleteRole);

module.exports = router;
