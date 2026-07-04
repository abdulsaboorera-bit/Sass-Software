"use strict";

const { z } = require("zod");
const { GymSettings } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const get = asyncHandler(async (req, res) => {
  let settings = await GymSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  if (!settings) {
    settings = await GymSettings.create({ tenantId: req.tenantId });
    settings = settings.toObject();
  }
  return apiSuccess(res, { settings });
});

const update = asyncHandler(async (req, res) => {
  const settings = await GymSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    req.body,
    { new: true, upsert: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

module.exports = { get, update };
