"use strict";

const { z } = require("zod");
const inventoryService = require("../../services/clinic/inventory.service");
const pharmacyService = require("../../services/clinic/pharmacy.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate, boolParam } = require("../../utils/query");

const medicineSchema = z.object({
  categoryId: z.string().nullable().optional(),
  name: z.string().min(1),
  genericName: z.string().optional(),
  brand: z.string().optional(),
  strength: z.string().optional(),
  form: z.enum(["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "DROPS", "INHALER", "OTHER"]).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().int().nonnegative().optional(),
  unit: z.string().optional(),
  minStock: z.number().int().nonnegative().optional(),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  expiryDate: z.string().nullable().optional(),
  batchNumber: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  supplierName: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const movementSchema = z.object({
  medicineId: z.string().min(1),
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "DAMAGED", "EXPIRED"]),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const saleSchema = z.object({
  patientId: z.string().nullable().optional(),
  prescriptionId: z.string().nullable().optional(),
  customerName: z.string().optional(),
  items: z.array(z.object({ medicineId: z.string().min(1), quantity: z.number().positive() })).min(1),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(),
  paidAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 100 });
  const result = await inventoryService.list({
    tenantId: req.tenantId,
    categoryId: req.query.categoryId,
    form: req.query.form,
    search: req.query.search,
    lowStock: boolParam(req.query.lowStock),
    expiringSoon: boolParam(req.query.expiringSoon),
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const item = await inventoryService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { medicine: item });
});

const create = asyncHandler(async (req, res) => {
  const data = medicineSchema.parse(req.body);
  const item = await inventoryService.create({ tenantId: req.tenantId, data });
  return apiSuccess(res, { medicine: item }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const data = medicineSchema.partial().parse(req.body);
  const item = await inventoryService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { medicine: item });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await inventoryService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const recordMovement = asyncHandler(async (req, res) => {
  const data = movementSchema.parse(req.body);
  const item = await inventoryService.recordMovement({ tenantId: req.tenantId, ...data, createdBy: req.user.userId });
  return apiSuccess(res, { medicine: item }, 201);
});

const movements = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await inventoryService.movements({ tenantId: req.tenantId, medicineId: req.query.medicineId, type: req.query.type, page, limit });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await inventoryService.summary({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

const createSale = asyncHandler(async (req, res) => {
  const data = saleSchema.parse(req.body);
  const sale = await pharmacyService.createSale({ tenantId: req.tenantId, ...data, soldBy: req.user.userId });
  return apiSuccess(res, { sale }, 201);
});

const listSales = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await pharmacyService.listSales({ tenantId: req.tenantId, patientId: req.query.patientId, from: req.query.from, to: req.query.to, status: req.query.status, page, limit });
  return apiSuccess(res, result);
});

const getSale = asyncHandler(async (req, res) => {
  const sale = await pharmacyService.getSale({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { sale });
});

const cancelSale = asyncHandler(async (req, res) => {
  const sale = await pharmacyService.cancelSale({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { sale });
});

const salesSummary = asyncHandler(async (req, res) => {
  const result = await pharmacyService.summary({ tenantId: req.tenantId, from: req.query.from, to: req.query.to });
  return apiSuccess(res, result);
});

module.exports = {
  list, getOne, create, update, remove, recordMovement, movements, summary,
  createSale, listSales, getSale, cancelSale, salesSummary,
};
