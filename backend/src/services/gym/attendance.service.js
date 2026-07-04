"use strict";

const mongoose = require("mongoose");
const { CheckIn, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { dayKey, addDays, monthRange, startOfDay, endOfDay } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Record a timestamped check-in. Duplicate check-ins for the same member on the
 * same calendar day are rejected (unique index + explicit guard). Updates the
 * member's lastAttendance* denormalisation and streak counters.
 */
async function checkIn({ tenantId, memberId, method = "MANUAL", trainerId, at }) {
  const member = await Member.findOne({ _id: memberId, tenantId });
  if (!member) throw ApiError.notFound("Member not found");

  const when = at ? new Date(at) : new Date();
  const key = dayKey(when);

  let record;
  try {
    record = await CheckIn.create({
      tenantId,
      memberId,
      checkInTime: when,
      dayKey: key,
      method,
      trainerId: trainerId || null,
    });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict("Member already checked in today");
    throw err;
  }

  // ── Streak update ──────────────────────────────────────
  const yesterday = dayKey(addDays(startOfDay(when), -1));
  if (member.lastAttendanceDay === yesterday) {
    member.currentStreak = (member.currentStreak || 0) + 1;
  } else if (member.lastAttendanceDay !== key) {
    member.currentStreak = 1;
  }
  member.longestStreak = Math.max(member.longestStreak || 0, member.currentStreak);
  member.lastAttendanceAt = when;
  member.lastAttendanceDay = key;
  await member.save();

  return {
    checkIn: record.toObject(),
    streak: { current: member.currentStreak, longest: member.longestStreak },
  };
}

/** Mark a check-out time on an open check-in. */
async function checkOut({ tenantId, checkInId, memberId, at }) {
  const filter = { tenantId, checkOutTime: null };
  if (checkInId) filter._id = checkInId;
  else if (memberId) {
    filter.memberId = memberId;
    filter.dayKey = dayKey(at ? new Date(at) : new Date());
  } else throw ApiError.badRequest("checkInId or memberId is required");

  const record = await CheckIn.findOneAndUpdate(
    filter,
    { checkOutTime: at ? new Date(at) : new Date() },
    { new: true, sort: { checkInTime: -1 } }
  ).lean();
  if (!record) throw ApiError.notFound("Open check-in not found");
  return record;
}

async function list({ tenantId, memberId, from, to, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (memberId) filter.memberId = memberId;
  if (from || to) {
    filter.checkInTime = {};
    if (from) filter.checkInTime.$gte = startOfDay(new Date(from));
    if (to) filter.checkInTime.$lte = endOfDay(new Date(to));
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    CheckIn.find(filter).populate("memberId", "name memberNo").sort({ checkInTime: -1 }).skip(skip).limit(limit).lean(),
    CheckIn.countDocuments(filter),
  ]);
  return { checkIns: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/**
 * Gym-wide monthly attendance summary via aggregation:
 * total check-ins, unique members, per-day breakdown, busiest day.
 */
async function monthlySummary({ tenantId, year, month }) {
  const { start, end } = monthRange(year, month);

  const [agg] = await CheckIn.aggregate([
    { $match: { tenantId: oid(tenantId), checkInTime: { $gte: start, $lte: end } } },
    {
      $facet: {
        totals: [
          { $group: { _id: null, total: { $sum: 1 }, members: { $addToSet: "$memberId" } } },
          { $project: { _id: 0, total: 1, uniqueMembers: { $size: "$members" } } },
        ],
        perDay: [
          { $group: { _id: "$dayKey", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, day: "$_id", count: 1 } },
        ],
      },
    },
  ]);

  const totals = (agg && agg.totals[0]) || { total: 0, uniqueMembers: 0 };
  const perDay = (agg && agg.perDay) || [];
  const busiest = perDay.reduce((a, b) => (b.count > (a ? a.count : 0) ? b : a), null);

  return {
    year,
    month,
    totalCheckIns: totals.total,
    uniqueMembers: totals.uniqueMembers,
    averagePerDay: perDay.length ? +(totals.total / perDay.length).toFixed(2) : 0,
    busiestDay: busiest,
    perDay,
  };
}

/** Per-member monthly attendance + current/longest streak. */
async function memberMonthlySummary({ tenantId, memberId, year, month }) {
  const member = await Member.findOne({ _id: memberId, tenantId })
    .select("name memberNo currentStreak longestStreak lastAttendanceAt")
    .lean();
  if (!member) throw ApiError.notFound("Member not found");

  const { start, end } = monthRange(year, month);
  const days = await CheckIn.distinct("dayKey", {
    tenantId,
    memberId,
    checkInTime: { $gte: start, $lte: end },
  });

  return {
    member: { id: String(member._id), name: member.name, memberNo: member.memberNo },
    year,
    month,
    daysAttended: days.length,
    days: days.sort(),
    streak: { current: member.currentStreak || 0, longest: member.longestStreak || 0 },
    lastAttendanceAt: member.lastAttendanceAt,
  };
}

/** Daily check-in counts for the last N days (attendance trend line). */
async function trends({ tenantId, days = 30 }) {
  const from = startOfDay(addDays(new Date(), -(days - 1)));
  const rows = await CheckIn.aggregate([
    { $match: { tenantId: oid(tenantId), checkInTime: { $gte: from } } },
    { $group: { _id: "$dayKey", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, day: "$_id", count: 1 } },
  ]);
  return rows;
}

module.exports = {
  checkIn,
  checkOut,
  list,
  monthlySummary,
  memberMonthlySummary,
  trends,
};
