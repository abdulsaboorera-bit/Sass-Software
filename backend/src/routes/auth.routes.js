"use strict";

const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Authenticated
router.get("/me", requireAuth, authController.me);

module.exports = router;
