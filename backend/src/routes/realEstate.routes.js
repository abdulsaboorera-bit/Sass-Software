"use strict";

const express = require("express");
const ctrl = require("../controllers/realEstate.controller");
const { requireAuth, requireTenant, requireIndustry } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");

const router = express.Router();
router.use(requireAuth, requireTenant, requireIndustry("REAL_ESTATE"));

router.get("/dashboard", requirePermission("analytics.view"), ctrl.dashboard);

router.get("/properties", requirePermission("properties.view"), ctrl.listProperties);
router.post("/properties", requirePermission("properties.create"), ctrl.createProperty);
router.patch("/properties", requirePermission("properties.edit"), ctrl.updateProperty);
router.patch("/properties/:id", requirePermission("properties.edit"), ctrl.updateProperty);
router.delete("/properties", requirePermission("properties.edit"), ctrl.archiveProperty);
router.delete("/properties/:id", requirePermission("properties.edit"), ctrl.archiveProperty);

router.get("/units", requirePermission("units.view"), ctrl.listUnits);
router.post("/units", requirePermission("units.create"), ctrl.createUnit);
router.patch("/units", requirePermission("units.edit"), ctrl.updateUnit);
router.patch("/units/:id", requirePermission("units.edit"), ctrl.updateUnit);
router.delete("/units", requirePermission("units.edit"), ctrl.archiveUnit);
router.delete("/units/:id", requirePermission("units.edit"), ctrl.archiveUnit);

router.get("/tenants", requirePermission("tenants.view"), ctrl.listTenants);
router.post("/tenants", requirePermission("tenants.create"), ctrl.createTenant);
router.patch("/tenants", requirePermission("tenants.edit"), ctrl.updateTenant);
router.patch("/tenants/:id", requirePermission("tenants.edit"), ctrl.updateTenant);

router.get("/leases", requirePermission("leases.view"), ctrl.listLeases);
router.post("/leases", requirePermission("leases.create"), ctrl.createLease);
router.get("/leases/:id", requirePermission("leases.view"), ctrl.getLease);
router.patch("/leases", requirePermission("leases.edit"), ctrl.updateLease);
router.patch("/leases/:id", requirePermission("leases.edit"), ctrl.updateLease);
router.post("/leases/:id/terminate", requirePermission("leases.edit"), ctrl.terminateLease);

router.get("/payments", requirePermission("billing.view"), ctrl.listPayments);
router.post("/payments", requirePermission("billing.create"), ctrl.recordPayment);

router.get("/expenses", requirePermission("expenses.view"), ctrl.listExpenses);
router.post("/expenses", requirePermission("expenses.create"), ctrl.createExpense);
router.patch("/expenses", requirePermission("expenses.edit"), ctrl.updateExpense);
router.patch("/expenses/:id", requirePermission("expenses.edit"), ctrl.updateExpense);
router.delete("/expenses", requirePermission("expenses.edit"), ctrl.deleteExpense);
router.delete("/expenses/:id", requirePermission("expenses.edit"), ctrl.deleteExpense);

router.get("/maintenance", requirePermission("maintenance.view"), ctrl.listMaintenance);
router.post("/maintenance", requirePermission("maintenance.create"), ctrl.createMaintenance);
router.patch("/maintenance", requirePermission("maintenance.edit"), ctrl.updateMaintenance);
router.patch("/maintenance/:id", requirePermission("maintenance.edit"), ctrl.updateMaintenance);

router.get("/vendors", requirePermission("vendors.view"), ctrl.listVendors);
router.post("/vendors", requirePermission("vendors.create"), ctrl.createVendor);
router.patch("/vendors", requirePermission("vendors.edit"), ctrl.updateVendor);
router.patch("/vendors/:id", requirePermission("vendors.edit"), ctrl.updateVendor);

router.get("/documents", requirePermission("documents.view"), ctrl.listDocuments);
router.post("/documents", requirePermission("documents.create"), ctrl.createDocument);
router.delete("/documents", requirePermission("documents.edit"), ctrl.deleteDocument);
router.delete("/documents/:id", requirePermission("documents.edit"), ctrl.deleteDocument);

router.get("/tasks", requirePermission("tasks.view"), ctrl.listTasks);
router.post("/tasks", requirePermission("tasks.create"), ctrl.createTask);
router.patch("/tasks", requirePermission("tasks.edit"), ctrl.updateTask);
router.patch("/tasks/:id", requirePermission("tasks.edit"), ctrl.updateTask);

module.exports = router;
