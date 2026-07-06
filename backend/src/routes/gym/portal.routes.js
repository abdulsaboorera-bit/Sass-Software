"use strict";

const express = require("express");
const ctrl = require("../../controllers/gym/portal.controller");
const { verifyMemberToken } = require("../../utils/jwt");
const { ApiError } = require("../../utils/apiResponse");

const router = express.Router();

/** Member-scoped auth: Bearer token or member_token cookie. */
function requireMember(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.cookies && req.cookies.member_token;
  const payload = token && verifyMemberToken(token);
  if (!payload) throw ApiError.unauthorized("Member session required");
  req.portalMember = { memberId: payload.memberId, tenantId: payload.tenantId };
  next();
}

// Public
router.post("/login", ctrl.login);

// Authenticated member area
router.use(requireMember);
router.get("/me", ctrl.me);
router.get("/attendance", ctrl.attendance);
router.get("/invoices", ctrl.invoices);
router.get("/badges", ctrl.badges);
router.get("/classes", ctrl.classes);
router.get("/bookings", ctrl.myBookings);
router.post("/bookings", ctrl.book);
router.delete("/bookings/:id", ctrl.cancelBooking);

module.exports = router;
