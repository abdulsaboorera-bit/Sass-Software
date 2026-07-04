"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { requirePermission } = require("../../middleware/rbac");
const { makeCrudRouter } = require("../../utils/crud");
const orderCtrl = require("../../controllers/restaurant/order.controller");
const menuCtrl = require("../../controllers/restaurant/menu.controller");
const { Staff, RestaurantTable, Shift, Supplier, InventoryItem } = require("../../models");

const router = express.Router();
router.use(requireAuth, requireTenant);

router.use("/staff", makeCrudRouter({
  model: Staff, permission: "staff", listKey: "staff", itemKey: "staff", paginated: false,
  searchFields: ["name", "role"], filterFields: ["isActive"],
}));

router.use("/tables", makeCrudRouter({
  model: RestaurantTable, permission: "tables", listKey: "tables", itemKey: "table", paginated: false,
  filterFields: ["status", "section"], sort: { number: 1 },
}));

router.use("/inventory", makeCrudRouter({
  model: InventoryItem, permission: "inventory", listKey: "items", itemKey: "item", paginated: false,
  searchFields: ["name"], filterFields: ["supplierId"], populate: [{ path: "supplierId", select: "name" }],
}));

router.use("/suppliers", makeCrudRouter({
  model: Supplier, permission: "inventory", listKey: "suppliers", itemKey: "supplier", paginated: false,
  searchFields: ["name"],
}));

router.use("/shifts", makeCrudRouter({
  model: Shift, permission: "staff", listKey: "shifts", itemKey: "shift",
  filterFields: ["staffId", "status"], populate: [{ path: "staffId", select: "name role" }],
}));

// Menu — dual entity (categories + items) under one endpoint.
router.get("/menu", requirePermission("menu.view"), menuCtrl.list);
router.post("/menu", requirePermission("menu.create"), menuCtrl.create);
router.patch("/menu", requirePermission("menu.edit"), menuCtrl.update);
router.delete("/menu", requirePermission("menu.edit"), menuCtrl.remove);

// Orders — computed totals + line items.
router.get("/orders", requirePermission("orders.view"), orderCtrl.list);
router.get("/orders/:id", requirePermission("orders.view"), orderCtrl.getOne);
router.post("/orders", requirePermission("orders.create"), orderCtrl.create);
router.patch("/orders", requirePermission("orders.edit"), orderCtrl.update);
router.patch("/orders/:id", requirePermission("orders.edit"), orderCtrl.update);
router.delete("/orders", requirePermission("orders.edit"), orderCtrl.remove);

module.exports = router;
