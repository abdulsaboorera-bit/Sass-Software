"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/trainer.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

// Trainer-facing self view (must precede "/:id" routes).
router.get("/me/members", requireAnyPermission("trainers.view.self", "trainers.view"), ctrl.myMembers);
// Workload leaderboard across trainers.
router.get("/workload", requirePermission("trainers.view"), ctrl.workloadAll);

// Collection style CRUD (frontend: PATCH id-in-body, DELETE ?id=).
router.get("/", requirePermission("trainers.view"), ctrl.list);
router.post("/", requirePermission("trainers.create"), ctrl.create);
router.patch("/", requireAnyPermission("trainers.edit", "trainers.create"), ctrl.update);
router.delete("/", requireAnyPermission("trainers.edit", "trainers.create"), ctrl.remove);

// REST style + sub-resources.
router.get("/:id/members", requirePermission("trainers.view"), ctrl.assignedMembers);
router.get("/:id/workload", requirePermission("trainers.view"), ctrl.workload);
router.post("/:id/assign", requireAnyPermission("members.edit", "trainers.edit"), ctrl.assignMember);
router.patch("/:id", requireAnyPermission("trainers.edit", "trainers.create"), ctrl.update);
router.delete("/:id", requireAnyPermission("trainers.edit", "trainers.create"), ctrl.remove);
router.delete("/assign/:memberId", requireAnyPermission("members.edit", "trainers.edit"), ctrl.unassignMember);

module.exports = router;
