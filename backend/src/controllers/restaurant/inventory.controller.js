"use strict";

const inventoryService = require("../../services/restaurant/inventory.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 100 });
  const result = await inventoryService.list({
    tenantId: req.tenantId,
    category: req.query.category,
    search: req.query.search,
    lowStock: req.query.lowStock === "true",
    supplierId: req.query.supplierId,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await inventoryService.summary({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const item = await inventoryService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { item });
});

const create = asyncHandler(async (req, res) => {
  const item = await inventoryService.create({ tenantId: req.tenantId, data: req.body });
  return apiSuccess(res, { item }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw Object.assign(new Error("id is required"), { status: 400 });
  const item = await inventoryService.update({ tenantId: req.tenantId, id, data: req.body });
  return apiSuccess(res, { item });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw Object.assign(new Error("id is required"), { status: 400 });
  const result = await inventoryService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const recordMovement = asyncHandler(async (req, res) => {
  const item = await inventoryService.recordMovement({
    tenantId: req.tenantId,
    itemId: req.body.itemId,
    type: req.body.type,
    quantity: req.body.quantity,
    unitPrice: req.body.unitPrice,
    reference: req.body.reference,
    notes: req.body.notes,
    createdBy: req.user.userId,
  });
  return apiSuccess(res, { item }, 201);
});

const movements = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await inventoryService.movements({
    tenantId: req.tenantId,
    itemId: req.query.itemId,
    type: req.query.type,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

module.exports = { list, summary, getOne, create, update, remove, recordMovement, movements };