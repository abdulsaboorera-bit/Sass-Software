"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/billing.controller");
const { requirePermission } = require("../../middleware/rbac");

const router = express.Router();

router.get("/invoices", requirePermission("billing.view"), ctrl.listInvoices);
router.get("/invoices/:id", requirePermission("billing.view"), ctrl.getInvoice);
router.post("/invoices", requirePermission("billing.create"), ctrl.createInvoice);
router.post("/invoices/:id/cancel", requirePermission("billing.edit"), ctrl.cancelInvoice);

router.post("/payments", requirePermission("billing.create"), ctrl.recordPayment);

// Manual trigger for overdue marking (the cron does this automatically daily).
router.post("/mark-overdue", requirePermission("billing.edit"), ctrl.markOverdue);

module.exports = router;
