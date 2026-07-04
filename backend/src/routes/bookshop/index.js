"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { requirePermission } = require("../../middleware/rbac");
const { makeCrudRouter } = require("../../utils/crud");
const saleCtrl = require("../../controllers/bookshop/sale.controller");
const { Book, Category, BookCustomer, PurchaseOrder } = require("../../models");

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

module.exports = router;
