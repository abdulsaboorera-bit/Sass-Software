"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { requirePermission } = require("../../middleware/rbac");
const { makeCrudRouter, sanitize } = require("../../utils/crud");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const saleCtrl = require("../../controllers/bookshop/sale.controller");
const { Book, Category, BookCustomer, PurchaseOrder, BookshopSettings } = require("../../models");

const router = express.Router();
router.use(requireAuth, requireTenant);

router.use("/books", makeCrudRouter({
  model: Book, permission: "inventory", listKey: "books", itemKey: "book",
  searchFields: ["title", "author", "isbn"], filterFields: ["category", "isActive"],
}));

router.use("/categories", makeCrudRouter({
  model: Category, permission: "inventory", listKey: "categories", itemKey: "category", paginated: false,
  searchFields: ["name"],
}));

router.use("/customers", makeCrudRouter({
  model: BookCustomer, permission: "customers", listKey: "customers", itemKey: "customer", paginated: false,
  searchFields: ["name", "phone"],
}));

router.use("/purchase-orders", makeCrudRouter({
  model: PurchaseOrder, permission: "inventory", listKey: "purchaseOrders", itemKey: "purchaseOrder",
  filterFields: ["status"],
}));

// Sales — computed totals + stock decrement + loyalty.
router.get("/sales", requirePermission("sales.view"), saleCtrl.list);
router.get("/sales/:id", requirePermission("sales.view"), saleCtrl.getOne);
router.post("/sales", requirePermission("sales.create"), saleCtrl.create);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await BookshopSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await BookshopSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;
