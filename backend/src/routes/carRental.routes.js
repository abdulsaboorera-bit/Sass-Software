"use strict";

const express = require("express");
const ctrl = require("../controllers/carRental.controller");
const extrasCtrl = require("../controllers/carRental/extras.controller");
const { requireAuth, requireTenant, requireIndustry } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");
const { sanitize } = require("../utils/crud");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { CarRentalSettings } = require("../models");

const router = express.Router();
router.use(requireAuth, requireTenant, requireIndustry("CAR_RENTAL"));

router.get("/dashboard", requirePermission("rentals.view"), ctrl.dashboard);

router.get("/cars", requirePermission("cars.view"), ctrl.listCars);
router.get("/cars/availability", requirePermission("cars.view"), extrasCtrl.availability);
router.get("/cars/expiring-documents", requirePermission("cars.view"), extrasCtrl.expiringDocuments);
router.post("/cars", requirePermission("cars.create"), ctrl.createCar);
router.patch("/cars", requirePermission("cars.edit"), ctrl.updateCar);
router.patch("/cars/:id", requirePermission("cars.edit"), ctrl.updateCar);
router.delete("/cars", requirePermission("cars.edit"), ctrl.archiveCar);
router.delete("/cars/:id", requirePermission("cars.edit"), ctrl.archiveCar);

router.get("/customers", requirePermission("customers.view"), ctrl.listCustomers);
router.post("/customers", requirePermission("customers.create"), ctrl.createCustomer);
router.patch("/customers", requirePermission("customers.edit"), ctrl.updateCustomer);
router.patch("/customers/:id", requirePermission("customers.edit"), ctrl.updateCustomer);

router.get("/rentals", requirePermission("rentals.view"), ctrl.listRentals);
router.post("/rentals", requirePermission("rentals.create"), ctrl.createRental);
router.get("/rentals/:id", requirePermission("rentals.view"), ctrl.getRental);
router.post("/rentals/:id/return", requirePermission("rentals.edit"), ctrl.returnRental);
router.post("/rentals/:id/checklist", requirePermission("rentals.edit"), ctrl.addChecklist);
router.post("/rentals/:id/cancel", requirePermission("rentals.edit"), ctrl.cancelRental);
router.post("/payments", requirePermission("billing.create"), ctrl.recordPayment);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await CarRentalSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await CarRentalSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;
