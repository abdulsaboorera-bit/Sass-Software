"use strict";

const express = require("express");
const authController = require("../controllers/auth.controller");
const twoFactorController = require("../controllers/twoFactor.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Authenticated
router.get("/me", requireAuth, authController.me);

// Two-factor authentication (TOTP)
router.get("/2fa/status", requireAuth, twoFactorController.status);
router.post("/2fa/setup", requireAuth, twoFactorController.setup);
router.post("/2fa/enable", requireAuth, twoFactorController.enable);
router.post("/2fa/disable", requireAuth, twoFactorController.disable);

module.exports = router;
