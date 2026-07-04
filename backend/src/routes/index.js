"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const meCtrl = require("../controllers/me.controller");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const gymRoutes = require("./gym");
const schoolRoutes = require("./school");
const clinicRoutes = require("./clinic");
const restaurantRoutes = require("./restaurant");
const bookshopRoutes = require("./bookshop");

const router = express.Router();

// Compat: the old Next.js frontend calls GET /api/me directly (not /api/auth/me).
// The me.controller returns the nested shape: { user: { user, tenant, tenantRole, permissions } }.
router.get("/me", requireAuth, meCtrl.me);

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/gym", gymRoutes);
router.use("/school", schoolRoutes);
router.use("/clinic", clinicRoutes);
router.use("/restaurant", restaurantRoutes);
router.use("/bookshop", bookshopRoutes);

module.exports = router;
