"use strict";

const { Car, Rental } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const BLOCKING = ["RESERVED", "ACTIVE", "OVERDUE"];

function parseDate(value, label) {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest(`Invalid ${label}`);
  return d;
}

/** GET /api/car-rental/availability?from=&to=&category=&search= — cars free for a window. */
const availability = asyncHandler(async (req, res) => {
  if (!req.query.from || !req.query.to) throw ApiError.badRequest("from and to are required");
  const from = parseDate(req.query.from, "from");
  const to = parseDate(req.query.to, "to");
  if (to <= from) throw ApiError.badRequest("to must be after from");

  const carFilter = { tenantId: req.tenantId, isActive: true };
  if (req.query.category) carFilter.category = req.query.category;
  if (req.query.search) carFilter.$or = [
    { registrationNo: { $regex: String(req.query.search), $options: "i" } },
    { make: { $regex: String(req.query.search), $options: "i" } },
    { model: { $regex: String(req.query.search), $options: "i" } },
  ];

  const cars = await Car.find(carFilter).lean({ virtuals: true });

  const booked = await Rental.find({
    tenantId: req.tenantId,
    status: { $in: BLOCKING },
    pickupAt: { $lt: to },
    dueAt: { $gt: from },
  }).select("carId").lean();
  const bookedIds = new Set(booked.map((r) => String(r.carId)));

  const available = cars.filter((c) => !bookedIds.has(String(c._id)));
  return apiSuccess(res, { window: { from, to }, count: available.length, cars: available });
});

/** GET /api/car-rental/expiring?days=30&kind=insurance|registration|service — documents due. */
const expiringDocuments = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);

  const kinds = ["insuranceExpiry", "registrationExpiry", "nextServiceDue"];
  const field = kinds.includes(req.query.kind) ? req.query.kind : "insuranceExpiry";

  const cars = await Car.find({
    tenantId: req.tenantId,
    isActive: true,
    [field]: { $ne: null, $lte: until },
  })
    .sort({ [field]: 1 })
    .lean({ virtuals: true });

  const withDays = cars.map((c) => {
    const at = c[field] ? new Date(c[field]) : null;
    const daysLeft = at ? Math.ceil((at.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
    return { ...c, daysLeft, kind: field };
  });

  return apiSuccess(res, { kind: field, days, count: withDays.length, cars: withDays });
});

module.exports = { availability, expiringDocuments };
