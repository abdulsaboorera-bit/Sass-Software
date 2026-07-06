"use strict";

const gamification = require("../../services/gym/gamification.service");
const insights = require("../../services/gym/insights.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const leaderboard = asyncHandler(async (req, res) => {
  const by = req.query.by === "checkins" ? "checkins" : "streak";
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  return apiSuccess(res, await gamification.leaderboard({ tenantId: req.tenantId, by, limit }));
});

const badges = asyncHandler(async (req, res) => {
  return apiSuccess(res, await gamification.memberBadges({ tenantId: req.tenantId, memberId: req.params.id }));
});

const peakHours = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
  return apiSuccess(res, await insights.peakHours({ tenantId: req.tenantId, days }));
});

const churn = asyncHandler(async (req, res) => {
  return apiSuccess(res, await insights.churn({ tenantId: req.tenantId }));
});

const forecast = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(2, parseInt(req.query.months, 10) || 6));
  return apiSuccess(res, await insights.revenueForecast({ tenantId: req.tenantId, months }));
});

module.exports = { leaderboard, badges, peakHours, churn, forecast };
