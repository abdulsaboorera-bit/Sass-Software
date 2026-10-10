"use strict";

const { z } = require("zod");
const expenseService = require("../../services/salon/expense.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];
const CATEGORIES = ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"];

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string().optional(),
  paymentMethod: z.enum(METHODS).optional(),
  reference: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 100 });
  const result = await expenseService.list({
    tenantId: req.tenantId,
    category: req.query.category,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const expense = await expenseService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { expense });
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const expense = await expenseService.create({ tenantId: req.tenantId, data });
  return apiSuccess(res, { expense }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const data = createSchema.partial().parse(req.body);
  const expense = await expenseService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { expense });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await expenseService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await expenseService.summary({ tenantId: req.tenantId, from: req.query.from, to: req.query.to });
  return apiSuccess(res, result);
});

module.exports = { list, getOne, create, update, remove, summary };
