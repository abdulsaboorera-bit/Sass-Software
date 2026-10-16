"use strict";

const mongoose = require("mongoose");
const { SalonStaff, SalonAppointment, SalonSettings } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/** Count of open minutes implied by settings.operatingHours across [start, end). */
function openMinutesForRange(operatingHours, start, end) {
  const minutesByDay = {};
  if (Array.isArray(operatingHours) && operatingHours.length) {
    for (const h of operatingHours) {
      if (h.isClosed) {
        minutesByDay[h.day] = 0;
        continue;
      }
      const [oh, om] = String(h.open || "09:00").split(":").map(Number);
      const [ch, cm] = String(h.close || "21:00").split(":").map(Number);
      minutesByDay[h.day] = Math.max(0, ch * 60 + cm - (oh * 60 + om));
    }
  }
  let total = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < end) {
    const weekday = cursor.getDay();
    total += minutesByDay[weekday] != null ? minutesByDay[weekday] : 8 * 60;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

/**
 * GET /api/salon/analytics/staff-utilization?from=&to=
 * Per-staff booked minutes vs open minutes, plus appointment counts.
 */
const staffUtilization = asyncHandler(async (req, res) => {
  const end = req.query.to ? new Date(String(req.query.to)) : new Date();
  const start = req.query.from ? new Date(String(req.query.from)) : new Date(end.getTime() - 29 * 86400000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw ApiError.badRequest("Invalid date range");

  const [staff, rows, settings] = await Promise.all([
    SalonStaff.find({ tenantId: req.tenantId, isActive: true }).select("name role specialization").sort({ name: 1 }).lean({ virtuals: true }),
    SalonAppointment.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(String(req.tenantId)),
          date: { $gte: start, $lt: end },
          status: { $in: ["SCHEDULED", "CONFIRMED", "COMPLETED"] },
          staffId: { $ne: null },
        },
      },
      { $group: { _id: "$staffId", appointments: { $sum: 1 }, bookedMinutes: { $sum: "$duration" }, revenue: { $sum: "$total" } } },
    ]),
    SalonSettings.findOne({ tenantId: req.tenantId }).select("operatingHours").lean(),
  ]);

  const openMinutes = openMinutesForRange(settings && settings.operatingHours, start, end);
  const byStaff = new Map(rows.map((r) => [String(r._id), r]));

  const result = staff.map((s) => {
    const agg = byStaff.get(String(s._id)) || { appointments: 0, bookedMinutes: 0, revenue: 0 };
    const utilization = openMinutes > 0 ? Math.min(100, Math.round((agg.bookedMinutes / openMinutes) * 1000) / 10) : 0;
    return {
      staffId: s._id,
      name: s.name,
      role: s.role,
      specialization: s.specialization,
      appointments: agg.appointments,
      bookedMinutes: agg.bookedMinutes,
      revenue: agg.revenue,
      utilization,
    };
  });

  return apiSuccess(res, {
    period: { from: start, to: end },
    openMinutes,
    staff: result.sort((a, b) => b.utilization - a.utilization),
  });
});

module.exports = { staffUtilization };
