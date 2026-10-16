"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const meCtrl = require("../controllers/me.controller");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const messagesRoutes = require("./messages.routes");
const gymRoutes = require("./gym");
const schoolRoutes = require("./school");
const clinicRoutes = require("./clinic");
const restaurantRoutes = require("./restaurant");
const bookshopRoutes = require("./bookshop");
const carRentalRoutes = require("./carRental.routes");
const realEstateRoutes = require("./realEstate.routes");
const salonRoutes = require("./salon");
const dataRoutes = require("./data.routes");
const notificationsRoutes = require("./notifications.routes");
const couponsRoutes = require("./coupons.routes");
const loyaltyRoutes = require("./loyalty.routes");
const publicRoutes = require("./public.routes");
const bookingsRoutes = require("./bookings.routes");
const auditLogsRoutes = require("./auditLogs.routes");
const searchRoutes = require("./search.routes");
const lookupRoutes = require("./lookup.routes");
const onboardingRoutes = require("./onboarding.routes");
const insightsRoutes = require("./insights.routes");
const teamRoutes = require("./team.routes");

const router = express.Router();

// Compat: the old Next.js frontend calls GET /api/me directly (not /api/auth/me).
// The me.controller returns the nested shape: { user: { user, tenant, tenantRole, permissions } }.
router.get("/me", requireAuth, meCtrl.me);

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messagesRoutes);
router.use("/gym", gymRoutes);
router.use("/school", schoolRoutes);
router.use("/clinic", clinicRoutes);
router.use("/restaurant", restaurantRoutes);
router.use("/bookshop", bookshopRoutes);
router.use("/car-rental", carRentalRoutes);
router.use("/real-estate", realEstateRoutes);
router.use("/salon", salonRoutes);
router.use("/data", dataRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/loyalty", loyaltyRoutes);
router.use("/public", publicRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/audit-logs", auditLogsRoutes);
router.use("/search", searchRoutes);
router.use("/lookup", lookupRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/insights", insightsRoutes);
router.use("/team", teamRoutes);

module.exports = router;
