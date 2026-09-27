"use strict";

const mongoose = require("mongoose");
const { ClassBooking, Session, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { computeMembershipStatus } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

function parseBookingDate(value) {
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(raw);
}

async function list({ tenantId, sessionId, memberId, date, status, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (sessionId) filter.sessionId = sessionId;
  if (memberId) filter.memberId = memberId;
  if (status) filter.status = status;
  if (date) {
    const d = parseBookingDate(date);
    if (Number.isNaN(d.getTime())) throw ApiError.badRequest("Invalid booking date");
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
  const status = computeMembershipStatus(member);
  if (status !== "ACTIVE") throw ApiError.badRequest("Only active members can book a class");

  const bookingDate = parseBookingDate(date);
  if (Number.isNaN(bookingDate.getTime())) throw ApiError.badRequest("Invalid booking date");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedDate = new Date(bookingDate);
  normalizedDate.setHours(0, 0, 0, 0);
  if (normalizedDate < today) throw ApiError.badRequest("Booking date must be today or in the future");
  if (normalizedDate.getDay() !== session.dayOfWeek) throw ApiError.badRequest("Date does not match the selected class day");
  if (computeMembershipStatus(member, normalizedDate) !== "ACTIVE") throw ApiError.badRequest("Membership is not active on the booking date");
  bookingDate.setHours(0, 0, 0, 0);
  const existing = await ClassBooking.findOne({
    tenantId, sessionId, memberId,
    date: { $gte: normalizedDate, $lte: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000 - 1) },
    status: { $ne: "CANCELLED" },
  });
  if (existing) throw ApiError.conflict("Member already booked for this session on this date");

  const bookedCount = await ClassBooking.countDocuments({
    tenantId, sessionId,
    date: { $gte: normalizedDate, $lte: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000 - 1) },
    status: { $in: ["BOOKED", "CHECKED_IN"] },
  });
  if (bookedCount >= session.capacity) throw ApiError.badRequest("Session is full");

  const booking = await ClassBooking.create({
    tenantId, sessionId, memberId, date: bookingDate, bookedBy,
  });
  return booking.toObject();
}

async function cancel({ tenantId, memberId, id, cancelReason }) {
  const booking = await ClassBooking.findOne({ _id: id, tenantId, ...(memberId ? { memberId } : {}) });
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
