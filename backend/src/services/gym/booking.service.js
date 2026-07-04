"use strict";

const mongoose = require("mongoose");
const { ClassBooking, Session, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function list({ tenantId, sessionId, memberId, date, status, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (sessionId) filter.sessionId = sessionId;
  if (memberId) filter.memberId = memberId;
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    ClassBooking.find(filter)
      .populate("sessionId", "name dayOfWeek startTime endTime")
      .populate("memberId", "name memberNo phone")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    ClassBooking.countDocuments(filter),
  ]);
  return { bookings: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function create({ tenantId, sessionId, memberId, date, bookedBy }) {
  const session = await Session.findOne({ _id: sessionId, tenantId, isActive: true });
  if (!session) throw ApiError.notFound("Session not found or inactive");

  const member = await Member.findOne({ _id: memberId, tenantId });
  if (!member) throw ApiError.notFound("Member not found");

  const bookingDate = new Date(date);
  const existing = await ClassBooking.findOne({
    tenantId, sessionId, memberId,
    date: { $gte: new Date(bookingDate.setHours(0, 0, 0, 0)), $lte: new Date(bookingDate.setHours(23, 59, 59, 999)) },
    status: { $ne: "CANCELLED" },
  });
  if (existing) throw ApiError.conflict("Member already booked for this session on this date");

  const bookedCount = await ClassBooking.countDocuments({
    tenantId, sessionId,
    date: { $gte: new Date(bookingDate.setHours(0, 0, 0, 0)), $lte: new Date(bookingDate.setHours(23, 59, 59, 999)) },
    status: { $in: ["BOOKED", "CHECKED_IN"] },
  });
  if (bookedCount >= session.capacity) throw ApiError.badRequest("Session is full");

  const booking = await ClassBooking.create({
    tenantId, sessionId, memberId, date: bookingDate, bookedBy,
  });
  return booking.toObject();
}

async function cancel({ tenantId, id, cancelReason }) {
  const booking = await ClassBooking.findOne({ _id: id, tenantId });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status === "CHECKED_IN") throw ApiError.badRequest("Cannot cancel a checked-in booking");
  if (booking.status === "CANCELLED") throw ApiError.badRequest("Booking is already cancelled");
  booking.status = "CANCELLED";
  booking.cancelReason = cancelReason;
  await booking.save();
  return booking.toObject();
}

async function checkIn({ tenantId, id }) {
  const booking = await ClassBooking.findOne({ _id: id, tenantId });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status !== "BOOKED") throw ApiError.badRequest("Only BOOKED entries can be checked in");
  booking.status = "CHECKED_IN";
  booking.checkedInAt = new Date();
  await booking.save();
  return booking.toObject();
}

module.exports = { list, create, cancel, checkIn };
