"use strict";

const { Member, GymInventoryItem, EquipmentMaintenance, GymSettings } = require("../models");
const billing = require("../services/gym/billing.service");
const notifications = require("../services/notification.service");
const { addDays, startOfDay, endOfDay, daysBetween } = require("../utils/dates");

// Tunables (could be promoted to env/tenant settings later).
const EXPIRING_SOON_DAYS = 3;
const MISSED_ATTENDANCE_DAYS = 7;
const EQUIPMENT_MAINTENANCE_WARN_DAYS = 7;

/**
 * Flip ACTIVE memberships whose endDate has passed to EXPIRED and notify.
 * Only members that were still marked ACTIVE are touched, so notifications
 * fire exactly once per expiry.
 */
async function expireMemberships({ tenantId, now, notify = true }) {
  const filter = { status: "ACTIVE", endDate: { $lt: now } };
  if (tenantId) filter.tenantId = tenantId;

  const expired = await Member.find(filter).select("name phone endDate tenantId").lean();
  if (!expired.length) return { expired: 0 };

  await Member.updateMany({ _id: { $in: expired.map((m) => m._id) } }, { $set: { status: "EXPIRED" } });
  if (notify) for (const m of expired) await notifications.membershipExpired(m);
  return { expired: expired.length };
}

/** Notify members whose membership expires within EXPIRING_SOON_DAYS days. */
async function notifyExpiringSoon({ tenantId, now, days = EXPIRING_SOON_DAYS, enabled = true }) {
  if (!enabled) return { expiringSoon: 0, notified: 0 };
  const soon = endOfDay(addDays(now, days));
  const filter = { status: "ACTIVE", endDate: { $gte: startOfDay(now), $lte: soon } };
  if (tenantId) filter.tenantId = tenantId;

  const members = await Member.find(filter).select("name phone endDate tenantId").lean();
  let notified = 0;
  for (const m of members) {
    const daysLeft = Math.max(0, daysBetween(now, m.endDate));
    const created = await notifications.membershipExpiringSoon(m, daysLeft);
    if (created) notified += 1;
  }
  return { expiringSoon: members.length, notified };
}

/** Notify active members who haven't checked in for MISSED_ATTENDANCE_DAYS days. */
async function notifyMissedAttendance({ tenantId, now, days = MISSED_ATTENDANCE_DAYS, enabled = true }) {
  if (!enabled) return { missedAttendance: 0 };
  const cutoff = startOfDay(addDays(now, -days));
  const filter = { status: "ACTIVE", lastAttendanceAt: { $ne: null, $lt: cutoff } };
  if (tenantId) filter.tenantId = tenantId;

  const members = await Member.find(filter).select("name phone lastAttendanceAt tenantId").lean();
  let notified = 0;
  for (const m of members) {
    const days = Math.abs(daysBetween(m.lastAttendanceAt, now));
    const created = await notifications.missedAttendance(m, days);
    if (created) notified += 1;
  }
  return { missedAttendance: notified };
}

/** Check low stock inventory items and create notification entries. */
async function checkLowStock({ tenantId }) {
  const filter = { isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } };
  if (tenantId) filter.tenantId = tenantId;
  const items = await GymInventoryItem.find(filter).select("name quantity minStock category").lean();
  return { lowStockItems: items.length, items: items.map((i) => i.name) };
}

/** Check equipment due for maintenance within warning window. */
async function checkEquipmentMaintenance({ tenantId, now }) {
  const warnDate = addDays(now, EQUIPMENT_MAINTENANCE_WARN_DAYS);
  const filter = {
    isActive: true,
    nextMaintenanceDate: { $lte: warnDate },
    status: { $ne: "RETIRED" },
  };
  if (tenantId) filter.tenantId = tenantId;
  const items = await EquipmentMaintenance.find(filter).select("itemName nextMaintenanceDate status").lean();
  return { dueForMaintenance: items.length, items: items.map((i) => i.itemName) };
}

/**
 * The full daily maintenance pass. Runs platform-wide by default, or for a
 * single tenant when `tenantId` is supplied. Safe to run repeatedly.
 */
async function runGymDaily({ tenantId } = {}) {
  const now = new Date();
  const started = Date.now();

  const settings = tenantId ? await GymSettings.findOne({ tenantId }).lean() : null;
  const notificationsEnabled = settings?.enableNotifications !== false;
  const expired = settings?.autoExpireMemberships === false
    ? { expired: 0 }
    : await expireMemberships({ tenantId, now, notify: notificationsEnabled });
  const expiring = await notifyExpiringSoon({
    tenantId,
    now,
    days: settings?.reminderDaysBeforeExpiry ?? EXPIRING_SOON_DAYS,
    enabled: notificationsEnabled,
  });
  const overdue = await billing.markOverdue({ tenantId, now });
  const missed = await notifyMissedAttendance({ tenantId, now, enabled: notificationsEnabled });
  const lowStock = await checkLowStock({ tenantId });
  const maintenance = await checkEquipmentMaintenance({ tenantId, now });

  // Deliver everything the pass just queued (log adapter until a real one is registered).
  const delivery = notificationsEnabled ? await notifications.dispatchPending({ tenantId }) : { processed: 0, sent: 0, failed: 0 };

  const summary = {
    ranAt: now,
    tookMs: Date.now() - started,
    membershipsExpired: expired.expired,
    expiringSoonNotified: expiring.notified,
    invoicesMarkedOverdue: overdue.marked,
    missedAttendanceNotified: missed.missedAttendance,
    lowStockItems: lowStock.lowStockItems,
    equipmentDueMaintenance: maintenance.dueForMaintenance,
    notificationsDispatched: delivery,
  };
  console.log("[cron] gym daily pass:", JSON.stringify(summary));
  return summary;
}

module.exports = {
  runGymDaily,
  expireMemberships,
  notifyExpiringSoon,
  notifyMissedAttendance,
  checkLowStock,
  checkEquipmentMaintenance,
};
