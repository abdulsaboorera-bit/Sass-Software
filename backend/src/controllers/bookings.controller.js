"use strict";

const { Booking } = require("../models");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { paginate } = require("../utils/query");
const { sanitize } = require("../utils/crud");

/** GET /api/bookings — staff view of incoming requests. */
async function list(req, res) {
  const { page, limit } = paginate(req.query, { maxLimit: 200 });
  const filter = { tenantId: req.tenantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(req.query.search, "i");
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { service: rx }];
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  return apiSuccess(res, { bookings, pagination: { page, limit, total } });
}

/** PATCH /api/bookings/:id — update status/notes. */
async function update(req, res) {
  const updates = sanitize(req.body);
  updates.handledBy = req.user.userId;
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true }
  ).lean();
  if (!booking) throw ApiError.notFound("Booking not found");
  return apiSuccess(res, { booking });
}

/** DELETE /api/bookings/:id */
async function remove(req, res) {
  const booking = await Booking.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!booking) throw ApiError.notFound("Booking not found");
  return apiSuccess(res, { success: true });
}

module.exports = { list, update, remove };
