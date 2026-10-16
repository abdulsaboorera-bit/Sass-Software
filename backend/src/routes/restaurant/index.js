"use strict";

const express = require("express");
const { requireAuth, requireTenant, requireIndustry } = require("../../middleware/auth");
const { makeCrudRouter, sanitize } = require("../../utils/crud");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const {
  RestaurantCustomer,
  RestaurantStaff,
  RestaurantTable,
  Shift,
  Supplier,
  Reservation,
  RestaurantAttendance,
  RestaurantSettings,
} = require("../../models");

const orderCtrl = require("../../controllers/restaurant/order.controller");
const menuCtrl = require("../../controllers/restaurant/menu.controller");
const reservationCtrl = require("../../controllers/restaurant/reservation.controller");
const inventoryCtrl = require("../../controllers/restaurant/inventory.controller");
const expenseRoutes = require("../../controllers/restaurant/expense.controller");
const payrollCtrl = require("../../controllers/restaurant/payroll.controller");
const billingCtrl = require("../../controllers/restaurant/billing.controller");
const analyticsCtrl = require("../../controllers/restaurant/analytics.controller");
const extrasCtrl = require("../../controllers/restaurant/extras.controller");

const router = express.Router();

// Everything in the restaurant module requires an authenticated user operating
// inside a tenant whose industry is RESTAURANT.
router.use(requireAuth, requireTenant, requireIndustry("RESTAURANT"));

const validateReference = (model, field, label) => async (payload, req) => {
  if (payload[field] && !(await model.exists({ _id: payload[field], tenantId: req.tenantId }))) throw ApiError.badRequest(`Invalid ${label}`);
  return payload;
};

// ── Customers ────────────────────────────────────────────
router.use(
  "/customers",
  makeCrudRouter({
    model: RestaurantCustomer,
    permission: "customers",
    listKey: "customers",
    itemKey: "customer",
    searchFields: ["name", "phone", "customerNo", "email"],
    filterFields: ["isActive"],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      if (!payload.customerNo) {
        const count = await RestaurantCustomer.countDocuments({ tenantId: req.tenantId });
        payload.customerNo = `C-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Staff ────────────────────────────────────────────────
router.use(
  "/staff",
  makeCrudRouter({
    model: RestaurantStaff,
    permission: "staff",
    listKey: "staff",
    itemKey: "staff",
    paginated: false,
    searchFields: ["name", "role", "phone", "specialty"],
    filterFields: ["isActive", "role"],
    sort: { name: 1 },
  })
);

// ── Tables ───────────────────────────────────────────────
router.use(
  "/tables",
  makeCrudRouter({
    model: RestaurantTable,
    permission: "tables",
    listKey: "tables",
    itemKey: "table",
    paginated: false,
    filterFields: ["status", "section"],
    sort: { number: 1 },
  })
);

// ── Shifts (staff schedule) ──────────────────────────────
router.use(
  "/shifts",
  makeCrudRouter({
    model: Shift,
    permission: "staff",
    listKey: "shifts",
    itemKey: "shift",
    filterFields: ["staffId", "status"],
    populate: [{ path: "staff", select: "name role" }],
    sort: { date: -1, startTime: -1 },
    beforeCreate: validateReference(RestaurantStaff, "staffId", "staff member"),
    beforeUpdate: validateReference(RestaurantStaff, "staffId", "staff member"),
  })
);

// ── Suppliers ────────────────────────────────────────────
router.use(
  "/suppliers",
  makeCrudRouter({
    model: Supplier,
    permission: "inventory",
    listKey: "suppliers",
    itemKey: "supplier",
    paginated: false,
    searchFields: ["name", "category", "phone"],
    filterFields: ["isActive", "category"],
  })
);

// ── Menu — dual entity (categories + items) ──────────────
router.get("/menu", requirePermission("menu.view"), menuCtrl.list);
router.post("/menu", requirePermission("menu.create"), menuCtrl.create);
router.patch("/menu", requirePermission("menu.edit"), menuCtrl.update);
router.delete("/menu", requirePermission("menu.edit"), menuCtrl.remove);

// ── Reservations ─────────────────────────────────────────
router.get("/reservations", requirePermission("reservations.view"), reservationCtrl.list);
router.get("/reservations/:id", requirePermission("reservations.view"), reservationCtrl.getOne);
router.post("/reservations", requirePermission("reservations.create"), reservationCtrl.create);
router.patch("/reservations", requirePermission("reservations.edit"), reservationCtrl.update);
router.patch("/reservations/:id", requirePermission("reservations.edit"), reservationCtrl.update);
router.delete("/reservations", requirePermission("reservations.edit"), reservationCtrl.remove);
router.delete("/reservations/:id", requirePermission("reservations.edit"), reservationCtrl.remove);

// ── Orders + POS ─────────────────────────────────────────
router.get("/orders", requirePermission("orders.view"), orderCtrl.list);
router.get("/orders/:id", requirePermission("orders.view"), orderCtrl.getOne);
router.post("/orders", requirePermission("orders.create"), orderCtrl.create);
router.patch("/orders", requirePermission("orders.edit"), orderCtrl.update);
router.patch("/orders/:id", requirePermission("orders.edit"), orderCtrl.update);
router.delete("/orders", requirePermission("orders.edit"), orderCtrl.remove);
router.delete("/orders/:id", requirePermission("orders.edit"), orderCtrl.remove);
router.post("/orders/:id/checkout", requirePermission("orders.edit"), orderCtrl.checkout);
router.delete("/order-items/:id", requirePermission("orders.edit"), orderCtrl.deleteItem);

// ── Inventory (raw materials + movements) ────────────────
router.get("/inventory/summary", requirePermission("inventory.view"), inventoryCtrl.summary);
router.get("/inventory/movements", requirePermission("inventory.view"), inventoryCtrl.movements);
router.post("/inventory/movements", requirePermission("inventory.edit"), inventoryCtrl.recordMovement);
router.get("/inventory", requirePermission("inventory.view"), inventoryCtrl.list);
router.post("/inventory", requirePermission("inventory.create"), inventoryCtrl.create);
router.patch("/inventory", requirePermission("inventory.edit"), inventoryCtrl.update);
router.delete("/inventory", requirePermission("inventory.edit"), inventoryCtrl.remove);
router.get("/inventory/:id", requirePermission("inventory.view"), inventoryCtrl.getOne);
router.patch("/inventory/:id", requirePermission("inventory.edit"), inventoryCtrl.update);
router.delete("/inventory/:id", requirePermission("inventory.edit"), inventoryCtrl.remove);

// ── Expenses ─────────────────────────────────────────────
router.use("/expenses", expenseRoutes);

// ── Payroll (salaries) ───────────────────────────────────
router.get("/salaries/summary", requirePermission("salaries.view"), payrollCtrl.summary);
router.post("/salaries/generate", requirePermission("salaries.create"), payrollCtrl.generate);
router.get("/salaries", requirePermission("salaries.view"), payrollCtrl.list);
router.post("/salaries/:id/pay", requirePermission("salaries.edit"), payrollCtrl.markPaid);
router.get("/salaries/:id", requirePermission("salaries.view"), payrollCtrl.getOne);
router.patch("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.update);
router.patch("/salaries", requirePermission("salaries.edit"), payrollCtrl.update);
router.delete("/salaries", requirePermission("salaries.edit"), payrollCtrl.remove);
router.delete("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.remove);

// ── Billing (invoices + payments) ────────────────────────
router.get("/invoices", requirePermission("billing.view"), billingCtrl.listInvoices);
router.get("/invoices/:id", requirePermission("billing.view"), billingCtrl.getInvoice);
router.post("/invoices", requirePermission("billing.create"), billingCtrl.createInvoice);
router.post("/invoices/:id/cancel", requirePermission("billing.edit"), billingCtrl.cancelInvoice);
router.get("/payments", requirePermission("billing.view"), billingCtrl.listPayments);
router.post("/payments", requirePermission("billing.create"), billingCtrl.recordPayment);
router.patch("/payments", requirePermission("billing.edit"), billingCtrl.updatePayment);
router.patch("/payments/:id", requirePermission("billing.edit"), billingCtrl.updatePayment);
router.delete("/payments", requirePermission("billing.edit"), billingCtrl.deletePayment);
router.delete("/payments/:id", requirePermission("billing.edit"), billingCtrl.deletePayment);
router.post("/mark-overdue", requirePermission("billing.edit"), billingCtrl.markOverdue);

// ── Staff attendance ─────────────────────────────────────
router.use(
  "/staff-attendance",
  makeCrudRouter({
    model: RestaurantAttendance,
    permission: "staff-attendance",
    listKey: "attendance",
    itemKey: "attendance",
    filterFields: ["staffId", "status", "dayKey"],
    populate: [{ path: "staff", select: "name role" }],
    sort: { date: -1 },
    beforeCreate: validateReference(RestaurantStaff, "staffId", "staff member"),
  })
);

// ── Analytics / reports ──────────────────────────────────
const canView = requireAnyPermission("analytics.view", "billing.view", "orders.view");
router.get("/analytics/dashboard", canView, analyticsCtrl.dashboard);
router.get("/analytics/revenue", canView, analyticsCtrl.revenue);
router.get("/analytics/top-items", canView, analyticsCtrl.topItems);
router.get("/analytics/hourly-sales", canView, analyticsCtrl.hourlySales);
router.get("/analytics/order-stats", canView, analyticsCtrl.orderStats);
router.get("/analytics/pending-invoices", requirePermission("billing.view"), analyticsCtrl.pendingInvoices);

// ── Kitchen display + Z-report ───────────────────────────
router.get("/kitchen/orders", requireAnyPermission("orders.view", "orders.edit"), extrasCtrl.kitchenBoard);
router.get("/reports/z-report", requireAnyPermission("analytics.view", "billing.view", "orders.view"), extrasCtrl.zReport);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await RestaurantSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;