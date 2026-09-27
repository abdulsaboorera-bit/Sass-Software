"use strict";

const { z } = require("zod");
const expenseService = require("../../services/gym/expense.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const createSchema = z.object({
  category: z.enum(["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"]),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(),
  reference: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]).optional(),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await expenseService.list({
    tenantId: req.tenantId,
    category: req.query.category,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
    page, limit,
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

const updateSchema = createSchema.partial();

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  const data = updateSchema.parse(req.body);
  const expense = await expenseService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { expense });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  const result = await expenseService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await expenseService.summary({
    tenantId: req.tenantId,
    from: req.query.from,
    to: req.query.to,
  });
  return apiSuccess(res, result);
});

module.exports = { list, getOne, create, update, remove, summary };
