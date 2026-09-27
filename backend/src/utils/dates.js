"use strict";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the given day (00:00:00.000) in server local time. */
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** End of the given day (23:59:59.999). */
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Parse a date query value without treating a date-only value as UTC. */
function parseDateInput(value, end = false) {
  if (!value) return null;
  const raw = String(value);
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    date = new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  } else {
    date = new Date(raw);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(d, days) {
  return new Date(new Date(d).getTime() + days * DAY_MS);
}

/** Whole days from `from` until `to` (negative if `to` is in the past). */
function daysBetween(from, to) {
  return Math.ceil((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

/** First and last instant of a given month. `month` is 1-12. */
function monthRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/** YYYY-MM-DD key in local time — used to group check-ins by calendar day. */
function dayKey(d = new Date()) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Derive a membership's effective status from its stored status + endDate.
 * A member frozen by staff stays frozen regardless of dates; otherwise the
 * status is active/expired purely from the expiry date. This is the single
 * source of truth used by both the API (on read) and the daily cron (on write).
 */
function computeMembershipStatus(member, now = new Date()) {
  if (member.status === "FROZEN") return "FROZEN";
  if (member.status === "CANCELLED") return "CANCELLED";
  if (!member.endDate) return "ACTIVE";
  return new Date(member.endDate).getTime() < now.getTime() ? "EXPIRED" : "ACTIVE";
}

module.exports = {
  DAY_MS,
  startOfDay,
  endOfDay,
  parseDateInput,
  addDays,
  daysBetween,
  monthRange,
  dayKey,
  computeMembershipStatus,
};
