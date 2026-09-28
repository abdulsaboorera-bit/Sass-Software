"use strict";

const { Staff, StaffAttendance, GymSettings } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { dayKeyInTimezone, monthRange, parseDateInput } = require("../../utils/dates");

async function dateKey(tenantId, value) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    if (!parseDateInput(value)) throw ApiError.badRequest("Invalid attendance date");
    return String(value);
  }
  const parsed = value ? parseDateInput(value) : new Date();
  if (!parsed || Number.isNaN(parsed.getTime())) throw ApiError.badRequest("Invalid attendance date");
  const settings = await GymSettings.findOne({ tenantId }).select("timezone").lean();
  return dayKeyInTimezone(parsed, settings?.timezone || "Asia/Karachi");
}

/** Upsert today's (or a given day's) attendance status for one staff member. */
async function markAttendance({ tenantId, staffId, date, status, notes }) {
  const staff = await Staff.findOne({ _id: staffId, tenantId });
  if (!staff) throw ApiError.notFound("Staff member not found");
  if (!staff.isActive) throw ApiError.badRequest("Cannot mark attendance for inactive staff");

  const key = await dateKey(tenantId, date);
  const record = await StaffAttendance.findOneAndUpdate(
    { tenantId, staffId, dayKey: key },
    { status, notes },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return record;
}

/** All active staff for a tenant, joined with that day's attendance status (null if unmarked). */
async function listByDate({ tenantId, date }) {
  const key = await dateKey(tenantId, date);
  const [staff, records] = await Promise.all([
    Staff.find({ tenantId, isActive: true }).sort({ name: 1 }).lean(),
    StaffAttendance.find({ tenantId, dayKey: key }).lean(),
  ]);
  const byStaff = new Map(records.map((r) => [String(r.staffId), r]));
  return {
    date: key,
    staff: staff.map((s) => ({
      id: String(s._id),
      name: s.name,
      phone: s.phone,
      role: s.role || null,
      status: byStaff.get(String(s._id))?.status || null,
      notes: byStaff.get(String(s._id))?.notes || null,
    })),
  };
}

/** Per-staff monthly present/absent/late/leave day counts. */
async function monthlySummary({ tenantId, staffId, year, month }) {
  const staff = await Staff.findOne({ _id: staffId, tenantId }).select("name phone role").lean();
  if (!staff) throw ApiError.notFound("Staff member not found");

  const { start, end } = monthRange(year, month);
  const settings = await GymSettings.findOne({ tenantId }).select("timezone").lean();
  const timeZone = settings?.timezone || "Asia/Karachi";
  const records = await StaffAttendance.find({
    tenantId,
    staffId,
    dayKey: { $gte: dayKeyInTimezone(start, timeZone), $lte: dayKeyInTimezone(end, timeZone) },
  }).lean();

  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
  for (const r of records) counts[r.status] = (counts[r.status] || 0) + 1;

  return {
    staff: { id: String(staff._id), name: staff.name },
    year,
    month,
    ...counts,
    totalMarked: records.length,
  };
}

module.exports = { markAttendance, listByDate, monthlySummary };
