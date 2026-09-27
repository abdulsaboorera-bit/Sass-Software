"use strict";

const { z } = require("zod");
const inventoryService = require("../../services/gym/inventory.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate, boolParam } = require("../../utils/query");

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["SUPPLEMENT", "DRINK", "MERCHANDISE", "EQUIPMENT", "OTHER"]).optional(),
  sku: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  unit: z.string().optional(),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  supplierName: z.string().optional(),
  location: z.string().optional(),
});

const movementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"]),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await inventoryService.list({
    tenantId: req.tenantId,
    category: req.query.category,
    search: req.query.search,
    lowStock: boolParam(req.query.lowStock),
    page, limit,
  });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const item = await inventoryService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { item });
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const item = await inventoryService.create({ tenantId: req.tenantId, data });
  return apiSuccess(res, { item }, 201);
});

const updateSchema = createSchema.partial();

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  const data = updateSchema.parse(req.body);
  const item = await inventoryService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { item });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  const result = await inventoryService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const recordMovement = asyncHandler(async (req, res) => {
  const data = movementSchema.parse(req.body);
  const item = await inventoryService.recordMovement({
    tenantId: req.tenantId, ...data, createdBy: req.user.userId,
  });
  return apiSuccess(res, { item }, 201);
});

const movements = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await inventoryService.movements({
    tenantId: req.tenantId, itemId: req.query.itemId, type: req.query.type, page, limit,
  });
  return apiSuccess(res, result);
});

const lowStock = asyncHandler(async (req, res) => {
  const items = await inventoryService.lowStockAlerts({ tenantId: req.tenantId });
  return apiSuccess(res, { items });
});

const summary = asyncHandler(async (req, res) => {
  const result = await inventoryService.summary({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { list, getOne, create, update, remove, recordMovement, movements, lowStock, summary };
