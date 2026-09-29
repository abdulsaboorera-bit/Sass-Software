"use strict";

const { z } = require("zod");
const { GymSettings, Tenant } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { sanitize } = require("../../utils/crud");

const operatingHourSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  isClosed: z.boolean().optional(),
});

const legacyOperatingHoursSchema = z.object({
  open: z.string().optional(),
  close: z.string().optional(),
  days: z.array(z.string()).optional(),
}).transform((value) => Array.from({ length: 7 }, (_, day) => ({
  day,
  open: value.open || "06:00",
  close: value.close || "22:00",
  isClosed: Array.isArray(value.days) && value.days.length > 0 ? !value.days.includes(String(day)) : false,
})));

const updateSchema = z.object({
  gymName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  logo: z.string().optional(),
  tagline: z.string().optional(),
  website: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  operatingHours: z.union([z.array(operatingHourSchema), legacyOperatingHoursSchema]).optional(),
  lateCheckInMinutes: z.number().int().nonnegative().optional(),
  autoExpireMemberships: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  enableWhatsApp: z.boolean().optional(),
  enableEmail: z.boolean().optional(),
  enableSMS: z.boolean().optional(),
  reminderDaysBeforeExpiry: z.number().int().nonnegative().optional(),
  reminderDaysBeforePayment: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  notifications: z.object({
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).optional(),
  membership: z.object({
    allowOverdueGrace: z.boolean().optional(),
    graceDays: z.number().int().nonnegative().optional(),
    autoFreeze: z.boolean().optional(),
  }).optional(),
});

const get = asyncHandler(async (req, res) => {
  let settings = await GymSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  const tenant = await Tenant.findById(req.tenantId).select("name currency timezone").lean();
  if (!settings) {
    settings = await GymSettings.create({ tenantId: req.tenantId, gymName: tenant?.name, currency: tenant?.currency, timezone: tenant?.timezone, operatingHours: defaultOperatingHours() });
    settings = settings.toObject();
  }
  return apiSuccess(res, { settings });
});

const update = asyncHandler(async (req, res) => {
  const parsed = updateSchema.parse(req.body);
  const { notifications, ...rest } = parsed;
  const data = sanitize(rest);
  if (notifications) {
    if (notifications.sms !== undefined) data.enableSMS = notifications.sms;
    if (notifications.email !== undefined) data.enableEmail = notifications.email;
    if (notifications.whatsapp !== undefined) data.enableWhatsApp = notifications.whatsapp;
  }
  const settings = await GymSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    data,
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  await Tenant.updateOne({ _id: req.tenantId }, {
    $set: {
      ...(data.gymName !== undefined ? { name: data.gymName } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
    },
  });
  return apiSuccess(res, { settings });
});

function defaultOperatingHours() {
  return Array.from({ length: 7 }, (_, day) => ({ day, open: "06:00", close: "22:00", isClosed: false }));
}

module.exports = { get, update };
