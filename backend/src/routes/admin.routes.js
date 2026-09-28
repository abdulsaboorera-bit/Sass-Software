"use strict";

const express = require("express");
const ctrl = require("../controllers/admin.controller");
const { requireSuperAdmin } = require("../middleware/auth");
const billingRoutes = require("./platformBilling.routes");
const messagesRoutes = require("./adminMessages.routes");

const router = express.Router();

// Platform administration — super admin only (tenant-independent).
router.use(requireSuperAdmin);

router.use("/billing", billingRoutes);
router.use("/messages", messagesRoutes);

router.get("/tenants", ctrl.listTenants);
router.post("/tenants", ctrl.createTenant);
router.get("/roles", ctrl.listRoles);
router.patch("/tenants", ctrl.updateTenant);
router.patch("/tenants/:id", ctrl.updateTenant);

router.get("/users", ctrl.listUsers);
router.post("/users", ctrl.createUser);
router.patch("/users", ctrl.updateUser);
router.patch("/users/:id", ctrl.updateUser);
router.delete("/users", ctrl.deleteUser);
router.delete("/users/:id", ctrl.deleteUser);

module.exports = router;
