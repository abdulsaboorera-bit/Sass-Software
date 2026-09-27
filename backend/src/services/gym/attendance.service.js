"use strict";

const mongoose = require("mongoose");
const { CheckIn, Member } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { dayKey, addDays, monthRange, startOfDay, endOfDay, parseDateInput, computeMembershipStatus } = require("../../utils/dates");
const billingService = require("./billing.service");

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
  if (Number.isNaN(when.getTime())) throw ApiError.badRequest("Invalid check-in time");
  if (when.getTime() > Date.now() + 5 * 60 * 1000) throw ApiError.badRequest("Check-in time cannot be in the future");
  if (computeMembershipStatus(member, when) !== "ACTIVE") throw ApiError.badRequest("Member does not have an active membership");
  const key = dayKey(when);

  if (await CheckIn.exists({ tenantId, memberId, dayKey: key })) {
    throw ApiError.conflict("Member already checked in today");
  }

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

  // Backdated check-ins must not move the member's latest attendance backwards.
  if (!member.lastAttendanceDay || key >= member.lastAttendanceDay) {
    const yesterday = dayKey(addDays(startOfDay(when), -1));
    if (member.lastAttendanceDay === yesterday) {
      member.currentStreak = (member.currentStreak || 0) + 1;
    } else if (member.lastAttendanceDay !== key) {
      member.currentStreak = 1;
    }
    member.longestStreak = Math.max(member.longestStreak || 0, member.currentStreak);
    member.lastAttendanceAt = when;
    member.lastAttendanceDay = key;
  }
  await member.save();

  const latestInvoices = await billingService.latestInvoicesByMember({ tenantId, memberIds: [memberId] });
  const feeStatus = latestInvoices.get(String(memberId))?.status || null;

  return {
    checkIn: record.toObject(),
    streak: { current: member.currentStreak, longest: member.longestStreak },
    feeStatus,
  };
}

/** Mark a check-out time on an open check-in. */
async function checkOut({ tenantId, checkInId, memberId, at }) {
  const when = at ? new Date(at) : new Date();
  if (Number.isNaN(when.getTime())) throw ApiError.badRequest("Invalid check-out time");
  if (when.getTime() > Date.now() + 5 * 60 * 1000) throw ApiError.badRequest("Check-out time cannot be in the future");
  const filter = { tenantId, checkOutTime: null };
  if (checkInId) filter._id = checkInId;
  else if (memberId) {
    filter.memberId = memberId;
    filter.dayKey = dayKey(when);
  } else throw ApiError.badRequest("checkInId or memberId is required");

  const record = await CheckIn.findOneAndUpdate(
    filter,
    { checkOutTime: when },
    { new: true, sort: { checkInTime: -1 } }
  ).lean();
  if (!record) throw ApiError.notFound("Open check-in not found");
  return record;
}

async function list({ tenantId, memberId, from, to, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (memberId) filter.memberId = memberId;
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
    if (start && end && start > end) throw ApiError.badRequest("Date range is reversed");
    filter.checkInTime = {};
    if (start) filter.checkInTime.$gte = start;
    if (end) filter.checkInTime.$lte = end;
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    CheckIn.find(filter).populate("memberId", "name memberNo").sort({ checkInTime: -1 }).skip(skip).limit(limit).lean(),
    CheckIn.countDocuments(filter),
  ]);

  const latestInvoices = await billingService.latestInvoicesByMember({
    tenantId,
    memberIds: rows.map((r) => r.memberId && r.memberId._id).filter(Boolean),
  });
  for (const r of rows) {
    r.feeStatus = r.memberId ? latestInvoices.get(String(r.memberId._id))?.status || null : null;
  }

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
