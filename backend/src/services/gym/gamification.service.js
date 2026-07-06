"use strict";

const mongoose = require("mongoose");
const { Member, CheckIn } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { monthRange, daysBetween } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/** Badge catalogue — each has a predicate over a member's computed stats. */
const BADGES = [
  { code: "FIRST_STEP", label: "First Step", icon: "👟", test: (s) => s.totalCheckIns >= 1 },
  { code: "WEEK_WARRIOR", label: "Week Warrior", icon: "🔥", test: (s) => s.currentStreak >= 7 },
  { code: "FORTNIGHT", label: "Fortnight Fighter", icon: "⚡", test: (s) => s.currentStreak >= 14 },
  { code: "MONTHLY_MASTER", label: "Monthly Master", icon: "🏆", test: (s) => s.longestStreak >= 30 },
  { code: "HALF_CENTURY", label: "50 Club", icon: "💪", test: (s) => s.totalCheckIns >= 50 },
  { code: "CENTURY", label: "Century Club", icon: "💯", test: (s) => s.totalCheckIns >= 100 },
  { code: "EARLY_BIRD", label: "Early Bird", icon: "🌅", test: (s) => s.earlyBird },
  { code: "NIGHT_OWL", label: "Night Owl", icon: "🌙", test: (s) => s.nightOwl },
  { code: "LOYAL", label: "Loyal Member", icon: "🎖️", test: (s) => s.tenureDays >= 365 },
];

/** Compute a member's stats and the badges they've earned. */
async function memberBadges({ tenantId, memberId }) {
  const member = await Member.findOne({ _id: memberId, tenantId })
    .select("name memberNo currentStreak longestStreak startDate")
    .lean();
  if (!member) throw ApiError.notFound("Member not found");

  const [agg] = await CheckIn.aggregate([
    { $match: { tenantId: oid(tenantId), memberId: oid(memberId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        earlyBird: { $max: { $cond: [{ $lt: [{ $hour: "$checkInTime" }, 8] }, 1, 0] } },
        nightOwl: { $max: { $cond: [{ $gte: [{ $hour: "$checkInTime" }, 21] }, 1, 0] } },
      },
    },
  ]);

  const stats = {
    totalCheckIns: agg ? agg.total : 0,
    currentStreak: member.currentStreak || 0,
    longestStreak: member.longestStreak || 0,
    earlyBird: !!(agg && agg.earlyBird),
    nightOwl: !!(agg && agg.nightOwl),
    tenureDays: member.startDate ? Math.abs(daysBetween(member.startDate, new Date())) : 0,
  };

  const earned = BADGES.filter((b) => b.test(stats)).map(({ test, ...b }) => b);
  const locked = BADGES.filter((b) => !b.test(stats)).map(({ test, ...b }) => b);

  return {
    member: { id: String(member._id), name: member.name, memberNo: member.memberNo },
    stats,
    earned,
    locked,
  };
}

/**
 * Leaderboards. `by`:
 *  - "streak"  => current streak (from Member)
 *  - "checkins"=> total check-ins this month (aggregation)
 */
async function leaderboard({ tenantId, by = "streak", limit = 10 }) {
  if (by === "checkins") {
    const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
    const rows = await CheckIn.aggregate([
      { $match: { tenantId: oid(tenantId), checkInTime: { $gte: start, $lte: end } } },
      { $group: { _id: "$memberId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $lookup: { from: "members", localField: "_id", foreignField: "_id", as: "m" } },
      { $unwind: "$m" },
      { $project: { _id: 0, memberId: "$_id", name: "$m.name", memberNo: "$m.memberNo", value: "$count" } },
    ]);
    return { by, unit: "check-ins this month", entries: rows.map((r, i) => ({ rank: i + 1, ...r })) };
  }

  const members = await Member.find({ tenantId, status: "ACTIVE" })
    .select("name memberNo currentStreak")
    .sort({ currentStreak: -1 })
    .limit(limit)
    .lean();
  return {
    by,
    unit: "day streak",
    entries: members.map((m, i) => ({
      rank: i + 1,
      memberId: String(m._id),
      name: m.name,
      memberNo: m.memberNo,
      value: m.currentStreak || 0,
    })),
  };
}

module.exports = { BADGES, memberBadges, leaderboard };
