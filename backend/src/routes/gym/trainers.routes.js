"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/trainer.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

// Workload leaderboard across trainers.
router.get("/workload", requirePermission("trainers.view"), ctrl.workloadAll);

// Collection style CRUD (frontend: PATCH id-in-body, DELETE ?id=).
router.get("/", requirePermission("trainers.view"), ctrl.list);
router.post("/", requirePermission("trainers.create"), ctrl.create);
router.patch("/", requirePermission("trainers.edit"), ctrl.update);
router.delete("/", requirePermission("trainers.edit"), ctrl.remove);

// REST style + sub-resources.
router.get("/me/members", requirePermission("members.view.assigned"), ctrl.selfMembers);
router.get("/:id/members", requirePermission("trainers.view"), ctrl.assignedMembers);
router.get("/:id/workload", requirePermission("trainers.view"), ctrl.workload);
router.post("/:id/assign", requireAnyPermission("members.edit", "trainers.edit"), ctrl.assignMember);
router.patch("/:id", requirePermission("trainers.edit"), ctrl.update);
router.delete("/:id", requirePermission("trainers.edit"), ctrl.remove);
router.delete("/assign/:memberId", requireAnyPermission("members.edit", "trainers.edit"), ctrl.unassignMember);

module.exports = router;
