"use strict";

const { z } = require("zod");
const { Reservation, RestaurantTable, RestaurantCustomer } = require("../../models");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const createSchema = z.object({
  customerId: z.string().optional(),
  tableId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  guests: z.number().int().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  notes: z.string().optional(),
});

const VALID_STATUS = ["PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW", "COMPLETED"];

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const filter = { tenantId: req.tenantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00`);
    const end = new Date(`${req.query.date}T23:59:59.999`);
    filter.date = { $gte: start, $lte: end };
  }
  const sort = {};
  if (req.query.date) sort.time = 1;
  else sort.createdAt = -1;
  const [rows, total] = await Promise.all([
    Reservation.find(filter)
      .populate("customer", "name phone customerNo")
      .populate("table", "number section")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Reservation.countDocuments(filter),
  ]);
  return apiSuccess(res, { reservations: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate("customer", "name phone customerNo")
    .populate("table", "number section")
    .lean({ virtuals: true });
  if (!reservation) throw ApiError.notFound("Reservation not found");
  return apiSuccess(res, { reservation });
});

async function validateRefs({ tenantId, customerId, tableId }) {
  if (customerId && customerId !== "undefined" && !(await RestaurantCustomer.exists({ _id: customerId, tenantId }))) throw ApiError.badRequest("Invalid customer");
  if (tableId && tableId !== "undefined" && !(await RestaurantTable.exists({ _id: tableId, tenantId }))) throw ApiError.badRequest("Invalid table");
}

/** Free a table only if this reservation actually holds it in the given state. */
async function releaseTable(tenantId, tableId, releasingStatuses) {
  if (!tableId) return;
  const reservation = await Reservation.exists({ tenantId, tableId, status: { $in: ["PENDING", "CONFIRMED", "SEATED"] } });
  if (reservation) return;
  await RestaurantTable.updateOne(
    { _id: tableId, tenantId, status: { $in: releasingStatuses } },
    { $set: { status: "AVAILABLE" } }
  );
}

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  await validateRefs({ tenantId: req.tenantId, customerId: data.customerId, tableId: data.tableId });
  const date = new Date(`${data.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest("Invalid date");
  const reservation = await Reservation.create({ tenantId: req.tenantId, ...data, date, status: "PENDING" });
  return apiSuccess(res, { reservation }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.body.id || req.params.id;
  if (!id) throw ApiError.badRequest("id is required");
  const existing = await Reservation.findOne({ _id: id, tenantId: req.tenantId });
  if (!existing) throw ApiError.notFound("Reservation not found");

  // Status transitions carry table side-effects.
  const nextStatus = req.body.status;
  if (nextStatus) {
    if (!VALID_STATUS.includes(nextStatus)) throw ApiError.badRequest("Invalid reservation status");
    const tableId = existing.tableId;
    if (nextStatus === "CONFIRMED" && tableId) {
      await RestaurantTable.updateOne({ _id: tableId, tenantId: req.tenantId }, { $set: { status: "RESERVED" } });
    } else if (nextStatus === "SEATED" && tableId) {
      await RestaurantTable.updateOne({ _id: tableId, tenantId: req.tenantId, status: { $in: ["AVAILABLE", "RESERVED"] } }, { $set: { status: "OCCUPIED" } });
    } else if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(nextStatus)) {
      await releaseTable(req.tenantId, tableId, ["RESERVED", "OCCUPIED"]);
    }
  }

  const updates = { ...req.body };
  delete updates.id;
  if (updates.date) {
    const date = new Date(`${updates.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw ApiError.badRequest("Invalid date");
    updates.date = date;
  }
  await validateRefs({ tenantId: req.tenantId, customerId: updates.customerId, tableId: updates.tableId });
  if (updates.tableId && String(updates.tableId) !== String(existing.tableId) && existing.status === "CONFIRMED") {
    // Table swapped — release the old table, hold the new one.
    await releaseTable(req.tenantId, existing.tableId, ["RESERVED"]);
    await RestaurantTable.updateOne({ _id: updates.tableId, tenantId: req.tenantId }, { $set: { status: "RESERVED" } });
  }

  const reservation = await Reservation.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, updates, { new: true, runValidators: true });
  return apiSuccess(res, { reservation });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.query.id || req.params.id;
  const reservation = await Reservation.findOne({ _id: id, tenantId: req.tenantId });
  if (!reservation) throw ApiError.notFound("Reservation not found");
  await reservation.deleteOne();
  await releaseTable(req.tenantId, reservation.tableId, ["RESERVED", "OCCUPIED"]);
  return apiSuccess(res, { success: true });
});

module.exports = { list, getOne, create, update, remove };