"use strict";

const express = require("express");
const { requireAuth, requireTenant, requireIndustry } = require("../../middleware/auth");
const { makeCrudRouter } = require("../../utils/crud");
const { MembershipPlan, Session, BodyMeasurement, Trainer, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");

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
const insightsRoutes = require("./insights.routes");
const portalRoutes = require("./portal.routes");
const staffRoutes = require("./staff.routes");
const staffAttendanceRoutes = require("./staffAttendance.routes");
const checkinsCtrl = require("../../controllers/gym/checkins.controller");
const billingCtrl = require("../../controllers/gym/billing.controller");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

const validateReference = (model, field, label) => async (payload, req) => {
  if (payload[field] && !(await model.exists({ _id: payload[field], tenantId: req.tenantId }))) throw ApiError.badRequest(`Invalid ${label}`);
  return payload;
};

// Cron trigger + member portal are mounted first, WITHOUT the staff tenant
// guard. Cron uses the x-cron-secret header; the portal uses its own member JWT.
router.use("/cron", cronRoutes);
router.use("/portal", portalRoutes);

// Everything below requires an authenticated user operating within a tenant.
router.use(requireAuth, requireTenant, requireIndustry("GYM"));

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
router.use("/insights", insightsRoutes);
router.use("/staff", staffRoutes);
router.use("/staff-attendance", staffAttendanceRoutes);

// Check-in kiosk endpoint (toggle by memberNo).
router.get("/checkins", requirePermission("attendance.view"), checkinsCtrl.list);
router.post("/checkins", requireAnyPermission("attendance.mark", "attendance.create"), checkinsCtrl.checkIn);

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
    beforeCreate: validateReference(Trainer, "trainerId", "trainer"),
    beforeUpdate: validateReference(Trainer, "trainerId", "trainer"),
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
    beforeCreate: validateReference(Member, "memberId", "member"),
    beforeUpdate: validateReference(Member, "memberId", "member"),
  })
);

// Payment reads share the legacy collection URL. Writes go through the billing
// service so invoice balances and statuses cannot be bypassed.
const paymentsRouter = express.Router();
paymentsRouter.get("/", requirePermission("billing.view"), billingCtrl.listPayments);
paymentsRouter.post("/", requirePermission("billing.create"), billingCtrl.recordPayment);
paymentsRouter.patch("/", requirePermission("billing.edit"), billingCtrl.updatePayment);
paymentsRouter.delete("/", requirePermission("billing.edit"), billingCtrl.deletePayment);
paymentsRouter.patch("/:id", requirePermission("billing.edit"), billingCtrl.updatePayment);
paymentsRouter.delete("/:id", requirePermission("billing.edit"), billingCtrl.deletePayment);
router.use("/payments", paymentsRouter);

module.exports = router;
