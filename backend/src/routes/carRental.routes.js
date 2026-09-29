"use strict";

const express = require("express");
const ctrl = require("../controllers/carRental.controller");
const { requireAuth, requireTenant, requireIndustry } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");

const router = express.Router();
router.use(requireAuth, requireTenant, requireIndustry("CAR_RENTAL"));

router.get("/dashboard", requirePermission("rentals.view"), ctrl.dashboard);

router.get("/cars", requirePermission("cars.view"), ctrl.listCars);
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
router.post("/rentals/:id/cancel", requirePermission("rentals.edit"), ctrl.cancelRental);
router.post("/payments", requirePermission("billing.create"), ctrl.recordPayment);

module.exports = router;
