"use strict";

const { z } = require("zod");
const authService = require("../services/auth.service");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { User } = require("../models");

const codeSchema = z.object({ code: z.string().min(6, "Enter the 6-digit code") });

/** GET /api/auth/2fa/status → { enabled } */
const status = asyncHandler(async (req, res) => {
  const result = await authService.twoFactorStatus(req.user.userId);
  return apiSuccess(res, result);
});

/** POST /api/auth/2fa/setup → { secret, otpauthUrl } (not yet enabled) */
const setup = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("email").lean();
  const result = await authService.beginTwoFactorSetup(user);
  return apiSuccess(res, result);
});

/** POST /api/auth/2fa/enable  { code } → { recoveryCodes } */
const enable = asyncHandler(async (req, res) => {
  const { code } = codeSchema.parse(req.body);
  const user = await User.findById(req.user.userId);
  const result = await authService.enableTwoFactor(user, code);
  return apiSuccess(res, result);
});

/** POST /api/auth/2fa/disable  { code } → { disabled: true } */
const disable = asyncHandler(async (req, res) => {
  const { code } = codeSchema.parse(req.body);
  const user = await User.findById(req.user.userId);
  const result = await authService.disableTwoFactor(user, code);
  return apiSuccess(res, result);
});

module.exports = { status, setup, enable, disable };
