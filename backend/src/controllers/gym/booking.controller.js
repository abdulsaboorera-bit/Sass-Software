"use strict";

const { z } = require("zod");
const bookingService = require("../../services/gym/booking.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const createSchema = z.object({
  sessionId: z.string().min(1),
  memberId: z.string().min(1),
  date: z.string().min(1),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await bookingService.list({
    tenantId: req.tenantId,
    sessionId: req.query.sessionId,
    memberId: req.query.memberId,
    date: req.query.date,
    status: req.query.status,
    page, limit,
  });
  return apiSuccess(res, result);
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const booking = await bookingService.create({
    tenantId: req.tenantId, ...data, bookedBy: req.user.userId,
  });
  return apiSuccess(res, { booking }, 201);
});

const cancel = asyncHandler(async (req, res) => {
  const { cancelReason } = req.body || {};
  const booking = await bookingService.cancel({ tenantId: req.tenantId, id: req.params.id, cancelReason });
  return apiSuccess(res, { booking });
});

const checkIn = asyncHandler(async (req, res) => {
  const booking = await bookingService.checkIn({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { booking });
});

module.exports = { list, create, cancel, checkIn };
