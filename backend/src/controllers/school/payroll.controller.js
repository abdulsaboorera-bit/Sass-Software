"use strict";

const { z } = require("zod");
const payrollService = require("../../services/school/payroll.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const generateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  overwrite: z.boolean().optional(),
});

const updateSchema = z.object({
  baseSalary: z.number().nonnegative().optional(),
  bonuses: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 100 });
  const result = await payrollService.list({ tenantId: req.tenantId, month: req.query.month, teacherId: req.query.teacherId, status: req.query.status, page, limit });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await payrollService.summary({ tenantId: req.tenantId, month: req.query.month });
  return apiSuccess(res, result);
});

const generate = asyncHandler(async (req, res) => {
  const data = generateSchema.parse(req.body);
  const result = await payrollService.generate({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

const getOne = asyncHandler(async (req, res) => {
  const salary = await payrollService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { salary });
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const data = updateSchema.parse(req.body);
  const salary = await payrollService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { salary });
});

const markPaid = asyncHandler(async (req, res) => {
  const salary = await payrollService.markPaid({ tenantId: req.tenantId, id: req.params.id, paymentMethod: req.body.paymentMethod });
  return apiSuccess(res, { salary });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await payrollService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

module.exports = { list, summary, generate, getOne, update, markPaid, remove };
