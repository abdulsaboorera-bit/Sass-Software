"use strict";

const { z } = require("zod");
const billing = require("../../services/school/billing.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

const voucherSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().optional(),
  amount: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  fine: z.number().nonnegative().optional(),
  month: z.string().optional(),
  year: z.number().optional(),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
});

const collectSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive(),
  month: z.string().optional(),
  year: z.number().optional(),
  method: z.enum(METHODS).optional(),
  remarks: z.string().optional(),
});

const generateSchema = z.object({
  classId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.number().optional(),
  dueDate: z.string().optional(),
  overwrite: z.boolean().optional(),
});

/** GET /api/school/fees — legacy-compatible list (payments + summary + pagination). */
const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await billing.listVouchers({
    tenantId: req.tenantId,
    studentId: req.query.studentId,
    month: req.query.month,
    year: req.query.year,
    status: req.query.status,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await billing.summary({ tenantId: req.tenantId, month: req.query.month, year: req.query.year });
  return apiSuccess(res, result);
});

/** POST /api/school/fees — legacy direct collection (records a PAID voucher). */
const create = asyncHandler(async (req, res) => {
  const data = collectSchema.parse(req.body);
  const payment = await billing.collectFee({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { payment }, 201);
});

/** POST /api/school/fees/vouchers — create a pending voucher. */
const createVoucher = asyncHandler(async (req, res) => {
  const data = voucherSchema.parse(req.body);
  const voucher = await billing.createVoucher({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { payment: voucher, voucher }, 201);
});

const generate = asyncHandler(async (req, res) => {
  const data = generateSchema.parse(req.body);
  const result = await billing.generateForClass({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

const pay = asyncHandler(async (req, res) => {
  const payment = await billing.payVoucher({ tenantId: req.tenantId, id: req.params.id, ...req.body });
  return apiSuccess(res, { payment });
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const payment = await billing.updateVoucher({ tenantId: req.tenantId, id, data: req.body });
  return apiSuccess(res, { payment });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await billing.deleteVoucher({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const cancel = asyncHandler(async (req, res) => {
  const voucher = await billing.cancelVoucher({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { voucher });
});

const markOverdue = asyncHandler(async (req, res) => {
  const result = await billing.markOverdue({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { list, summary, create, createVoucher, generate, pay, update, remove, cancel, markOverdue };
