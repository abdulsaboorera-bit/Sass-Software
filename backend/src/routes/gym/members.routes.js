"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/member.controller");
const { requirePermission } = require("../../middleware/rbac");
const { memberViewScope } = require("../../middleware/scope");

const router = express.Router();

// Reads use memberViewScope so trainers are auto-restricted to assigned members,
// while owners/receptionists (members.view) see everyone.
router.get("/", memberViewScope, ctrl.list);

// Writes require explicit management permissions.
// Collection style (frontend: PATCH with id in body, DELETE ?id=).
router.post("/", requirePermission("members.create"), ctrl.create);
router.patch("/", requirePermission("members.edit"), ctrl.update);
router.delete("/", requirePermission("members.edit"), ctrl.remove);

// REST style + sub-resources.
router.get("/:id", memberViewScope, ctrl.getOne);
router.get("/:id/payments", memberViewScope, ctrl.payments);
router.patch("/:id", requirePermission("members.edit"), ctrl.update);
router.post("/:id/notes", requirePermission("members.edit"), ctrl.addNote);
router.post("/:id/renew", requirePermission("members.edit"), ctrl.renew);
router.delete("/:id", requirePermission("members.edit"), ctrl.remove);

module.exports = router;
