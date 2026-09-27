"use strict";

const { Member } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");
const attendanceService = require("../../services/gym/attendance.service");

/**
 * POST /api/gym/checkins  body: { memberNo, action?, at? }
 * The kiosk supports both check-in and check-out. `at` optionally backdates
 * the record (defaults to now).
 */
const checkIn = asyncHandler(async (req, res) => {
  const { memberNo, action = "checkin", at } = req.body;
  if (!memberNo) throw ApiError.badRequest("memberNo is required");
  if (!["checkin", "checkout"].includes(action)) throw ApiError.badRequest("action must be checkin or checkout");

  const member = await Member.findOne({ tenantId: req.tenantId, memberNo });
  if (!member) throw ApiError.notFound("Member not found");

  if (action === "checkout") {
    const checkIn = await attendanceService.checkOut({ tenantId: req.tenantId, memberId: member._id, at });
    return apiSuccess(res, {
      action,
      member: { id: String(member._id), name: member.name, memberNo: member.memberNo },
      checkIn,
    });
  }

  const result = await attendanceService.checkIn({ tenantId: req.tenantId, memberId: member._id, method: "MANUAL", at });

  return apiSuccess(res, {
    action: "checkin",
    member: { id: String(member._id), name: member.name, memberNo: member.memberNo },
    streak: result.streak,
    feeStatus: result.feeStatus,
  }, 201);
});

/** GET /api/gym/checkins?memberId&limit -> { checkIns, pagination } */
const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await attendanceService.list({
    tenantId: req.tenantId,
    memberId: req.query.memberId,
    from: req.query.from,
    to: req.query.to,
    page, limit,
  });
  return apiSuccess(res, result);
});

module.exports = { checkIn, list };
