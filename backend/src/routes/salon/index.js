"use strict";

const express = require("express");
const { requireAuth, requireTenant, requireIndustry } = require("../../middleware/auth");
const { makeCrudRouter, sanitize } = require("../../utils/crud");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const {
  SalonCustomer,
  SalonService,
  SalonServiceCategory,
  SalonStaff,
  SalonAppointment,
  SalonSettings,
} = require("../../models");

const billingCtrl = require("../../controllers/salon/billing.controller");
const inventoryCtrl = require("../../controllers/salon/inventory.controller");
const payrollCtrl = require("../../controllers/salon/payroll.controller");
const analyticsCtrl = require("../../controllers/salon/analytics.controller");
const expenseCtrl = require("../../controllers/salon/expense.controller");

const router = express.Router();

// Everything in the salon module requires an authenticated user operating
// inside a tenant whose industry is SALON.
router.use(requireAuth, requireTenant, requireIndustry("SALON"));

const validateReference = (model, field, label) => async (payload, req) => {
  if (payload[field] && !(await model.exists({ _id: payload[field], tenantId: req.tenantId }))) throw ApiError.badRequest(`Invalid ${label}`);
  return payload;
};

/** Recompute an appointment's amount / duration / total from its services. */
async function prepareAppointment(payload, req) {
  if (payload.customerId && !(await SalonCustomer.exists({ _id: payload.customerId, tenantId: req.tenantId }))) {
    throw ApiError.badRequest("Invalid customer");
  }
  if (payload.staffId && !(await SalonStaff.exists({ _id: payload.staffId, tenantId: req.tenantId }))) {
    throw ApiError.badRequest("Invalid staff member");
  }
  const serviceIds = Array.isArray(payload.serviceIds) ? payload.serviceIds.filter(Boolean) : [];
  if (serviceIds.length) {
    const services = await SalonService.find({ _id: { $in: serviceIds }, tenantId: req.tenantId }).select("price duration").lean();
    if (services.length !== serviceIds.length) throw ApiError.badRequest("One or more selected services are invalid");
    payload.amount = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
    payload.duration = services.reduce((sum, s) => sum + Number(s.duration || 0), 0);
  }
  const amount = Number(payload.amount || 0);
  const discount = Number(payload.discount || 0);
  payload.total = Math.max(0, amount - discount);
  return payload;
}

// ── Customers ────────────────────────────────────────────
router.use(
  "/customers",
  makeCrudRouter({
    model: SalonCustomer,
    permission: "customers",
    listKey: "customers",
    itemKey: "customer",
    searchFields: ["name", "phone", "customerNo", "email"],
    filterFields: ["isActive", "gender"],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      if (!payload.customerNo) {
        const count = await SalonCustomer.countDocuments({ tenantId: req.tenantId });
        payload.customerNo = `C-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Service catalogue ────────────────────────────────────
router.use(
  "/service-categories",
  makeCrudRouter({
    model: SalonServiceCategory,
    permission: "services",
    listKey: "categories",
    itemKey: "category",
    paginated: false,
    searchFields: ["name"],
    sort: { sortOrder: 1, name: 1 },
  })
);

router.use(
  "/services",
  makeCrudRouter({
    model: SalonService,
    permission: "services",
    listKey: "services",
    itemKey: "service",
    searchFields: ["name"],
    filterFields: ["categoryId", "isActive"],
    populate: [{ path: "categoryId", select: "name" }],
    sort: { name: 1 },
    beforeCreate: validateReference(SalonServiceCategory, "categoryId", "category"),
    beforeUpdate: validateReference(SalonServiceCategory, "categoryId", "category"),
  })
);

// ── Staff ────────────────────────────────────────────────
router.use(
  "/staff",
  makeCrudRouter({
    model: SalonStaff,
    permission: "staff",
    listKey: "staff",
    itemKey: "staff",
    paginated: false,
    searchFields: ["name", "role", "phone", "specialization"],
    filterFields: ["isActive", "role"],
    sort: { name: 1 },
  })
);

// ── Appointments ─────────────────────────────────────────
router.use(
  "/appointments",
  makeCrudRouter({
    model: SalonAppointment,
    permission: "appointments",
    listKey: "appointments",
    itemKey: "appointment",
    searchFields: ["notes"],
    filterFields: ["status", "staffId", "customerId", "paymentStatus"],
    populate: [
      { path: "customerId", select: "name phone customerNo" },
      { path: "staffId", select: "name role" },
      { path: "services", select: "name price duration" },
    ],
    sort: { date: -1, startTime: -1 },
    beforeCreate: prepareAppointment,
    beforeUpdate: prepareAppointment,
  })
);

// ── Staff attendance ─────────────────────────────────────
router.use(
  "/staff-attendance",
  makeCrudRouter({
    model: require("../../models").SalonAttendance,
    permission: "staff-attendance",
    listKey: "attendance",
    itemKey: "attendance",
    filterFields: ["staffId", "status", "dayKey"],
    populate: [{ path: "staff", select: "name role" }],
    sort: { date: -1 },
  })
);

// ── Products / inventory ─────────────────────────────────
router.get("/products/summary", requirePermission("inventory.view"), inventoryCtrl.summary);
router.get("/products/movements", requirePermission("inventory.view"), inventoryCtrl.movements);
router.post("/products/movements", requirePermission("inventory.edit"), inventoryCtrl.recordMovement);
router.get("/products", requirePermission("inventory.view"), inventoryCtrl.list);
router.post("/products", requirePermission("inventory.create"), inventoryCtrl.create);
router.patch("/products", requirePermission("inventory.edit"), inventoryCtrl.update);
router.delete("/products", requirePermission("inventory.edit"), inventoryCtrl.remove);
router.get("/products/:id", requirePermission("inventory.view"), inventoryCtrl.getOne);
router.patch("/products/:id", requirePermission("inventory.edit"), inventoryCtrl.update);
router.delete("/products/:id", requirePermission("inventory.edit"), inventoryCtrl.remove);

// ── Expenses ─────────────────────────────────────────────
router.get("/expenses/summary", requirePermission("expenses.view"), expenseCtrl.summary);
router.get("/expenses", requirePermission("expenses.view"), expenseCtrl.list);
router.post("/expenses", requirePermission("expenses.create"), expenseCtrl.create);
router.patch("/expenses", requirePermission("expenses.edit"), expenseCtrl.update);
router.delete("/expenses", requirePermission("expenses.edit"), expenseCtrl.remove);
router.get("/expenses/:id", requirePermission("expenses.view"), expenseCtrl.getOne);
router.patch("/expenses/:id", requirePermission("expenses.edit"), expenseCtrl.update);
router.delete("/expenses/:id", requirePermission("expenses.edit"), expenseCtrl.remove);

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

// ── Analytics / reports ──────────────────────────────────
const canView = requireAnyPermission("analytics.view", "billing.view", "customers.view");
router.get("/analytics/dashboard", canView, analyticsCtrl.dashboard);
router.get("/analytics/customers", canView, analyticsCtrl.customers);
router.get("/analytics/appointments", canView, analyticsCtrl.appointments);
router.get("/analytics/revenue", canView, analyticsCtrl.revenue);
router.get("/analytics/pending-payments", canView, analyticsCtrl.pendingPayments);
router.get("/analytics/top-services", canView, analyticsCtrl.topServices);
router.get("/analytics/top-staff", canView, analyticsCtrl.topStaff);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await SalonSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await SalonSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;
