"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/expense.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/summary", requirePermission("billing.view"), ctrl.summary);

router.get("/", requirePermission("billing.view"), ctrl.list);
router.post("/", requirePermission("billing.create"), ctrl.create);
router.patch("/", requirePermission("billing.edit"), ctrl.update);
router.delete("/", requirePermission("billing.edit"), ctrl.remove);
router.get("/:id", requirePermission("billing.view"), ctrl.getOne);
router.patch("/:id", requirePermission("billing.edit"), ctrl.update);
router.delete("/:id", requirePermission("billing.edit"), ctrl.remove);

module.exports = router;
