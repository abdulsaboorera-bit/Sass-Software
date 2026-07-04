"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { makeCrudRouter } = require("../../utils/crud");
const { MembershipPlan, Session, BodyMeasurement, GymPayment } = require("../../models");

const membersRoutes = require("./members.routes");
const attendanceRoutes = require("./attendance.routes");
const billingRoutes = require("./billing.routes");
const trainersRoutes = require("./trainers.routes");
const analyticsRoutes = require("./analytics.routes");
const notificationsRoutes = require("./notifications.routes");
const cronRoutes = require("./cron.routes");
const inventoryRoutes = require("./inventory.routes");
const expenseRoutes = require("./expense.routes");
const reportsRoutes = require("./reports.routes");
const settingsRoutes = require("./settings.routes");
const bookingsRoutes = require("./bookings.routes");
const checkinsCtrl = require("../../controllers/gym/checkins.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

// Cron trigger is mounted first, WITHOUT the tenant guard, so external
// schedulers can call it with just the x-cron-secret header.
router.use("/cron", cronRoutes);

// Everything below requires an authenticated user operating within a tenant.
router.use(requireAuth, requireTenant);

router.use("/members", membersRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/billing", billingRoutes);
router.use("/trainers", trainersRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/expenses", expenseRoutes);
router.use("/reports", reportsRoutes);
router.use("/settings", settingsRoutes);
router.use("/bookings", bookingsRoutes);

// Check-in kiosk endpoint (toggle by memberNo).
router.get("/checkins", requirePermission("attendance.view"), checkinsCtrl.list);
router.post("/checkins", requireAnyPermission("attendance.mark", "attendance.create"), checkinsCtrl.toggle);

// Membership plans — frontend reads { plans } and manages them collection-style.
router.use(
  "/plans",
  makeCrudRouter({
    model: MembershipPlan,
    permission: "sessions",
    listKey: "plans",
    itemKey: "plan",
    paginated: false,
    searchFields: ["name"],
    filterFields: ["isActive"],
    perms: { view: "members.view" }, // members page loads plans for its dropdown
  })
);
router.use(
  "/sessions",
  makeCrudRouter({
    model: Session,
    permission: "sessions",
    listKey: "sessions",
    itemKey: "session",
    searchFields: ["name"],
    filterFields: ["trainerId", "dayOfWeek", "isActive"],
    populate: [{ path: "trainerId", select: "name" }],
    sort: { dayOfWeek: 1 },
  })
);
router.use(
  "/measurements",
  makeCrudRouter({
    model: BodyMeasurement,
    permission: "members",
    listKey: "measurements",
    itemKey: "measurement",
    filterFields: ["memberId"],
    sort: { recordedAt: -1 },
  })
);

// Payments — collection-level list for gym billing overview.
router.use(
  "/payments",
  makeCrudRouter({
    model: GymPayment,
    permission: "billing",
    listKey: "payments",
    itemKey: "payment",
    filterFields: ["memberId", "invoiceId", "method"],
    populate: [{ path: "memberId", select: "name memberNo" }],
    sort: { paidAt: -1 },
    perms: { view: "billing.view", create: "billing.create", edit: "billing.create", remove: "billing.create" },
  })
);

module.exports = router;
