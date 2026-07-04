"use strict";

const { CheckIn, Member } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");
const { dayKey } = require("../../utils/dates");
const attendanceService = require("../../services/gym/attendance.service");

/**
 * POST /api/gym/checkins  body: { memberNo }  ->  { action, member }
 * Toggles the member's check-in for today: creates a check-in (action
 * "checkin", updates streak) or stamps a check-out (action "checkout").
 */
const toggle = asyncHandler(async (req, res) => {
  const { memberNo } = req.body;
  if (!memberNo) throw ApiError.badRequest("memberNo is required");

  const member = await Member.findOne({ tenantId: req.tenantId, memberNo });
  if (!member) throw ApiError.notFound("Member not found");

  const today = dayKey();
  const existing = await CheckIn.findOne({ tenantId: req.tenantId, memberId: member._id, dayKey: today });

  if (!existing) {
    await attendanceService.checkIn({ tenantId: req.tenantId, memberId: member._id, method: "MANUAL" });
    return apiSuccess(res, { action: "checkin", member: { id: String(member._id), name: member.name, memberNo: member.memberNo } }, 201);
  }

  if (!existing.checkOutTime) {
    existing.checkOutTime = new Date();
    await existing.save();
  }
  return apiSuccess(res, { action: "checkout", member: { id: String(member._id), name: member.name, memberNo: member.memberNo } });
});

/** GET /api/gym/checkins?memberId&limit -> { checkins, pagination } */
const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const filter = { tenantId: req.tenantId };
  if (req.query.memberId) filter.memberId = req.query.memberId;
  const [rows, total] = await Promise.all([
    CheckIn.find(filter).populate("memberId", "name memberNo").sort({ checkInTime: -1 }).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
    CheckIn.countDocuments(filter),
  ]);
  return apiSuccess(res, { checkins: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

module.exports = { toggle, list };
