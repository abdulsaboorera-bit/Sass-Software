"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/inventory.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/low-stock", requirePermission("inventory.view"), ctrl.lowStock);
router.get("/summary", requirePermission("inventory.view"), ctrl.summary);
router.get("/movements", requirePermission("inventory.view"), ctrl.movements);
router.post("/movements", requirePermission("inventory.create"), ctrl.recordMovement);

router.get("/", requirePermission("inventory.view"), ctrl.list);
router.post("/", requirePermission("inventory.create"), ctrl.create);
router.patch("/", requirePermission("inventory.edit"), ctrl.update);
router.delete("/", requirePermission("inventory.edit"), ctrl.remove);
router.get("/:id", requirePermission("inventory.view"), ctrl.getOne);
router.patch("/:id", requirePermission("inventory.edit"), ctrl.update);
router.delete("/:id", requirePermission("inventory.edit"), ctrl.remove);

module.exports = router;
