"use strict";

const payroll = require("../../services/restaurant/payroll.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 100 });
  const result = await payroll.list({
    tenantId: req.tenantId,
    month: req.query.month,
    staffId: req.query.staffId,
    status: req.query.status,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const salary = await payroll.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { salary });
});

const generate = asyncHandler(async (req, res) => {
  const month = req.body.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const result = await payroll.generate({ tenantId: req.tenantId, month, overwrite: req.body.overwrite === true });
  return apiSuccess(res, result);
});

const summary = asyncHandler(async (req, res) => {
  const result = await payroll.summary({ tenantId: req.tenantId, month: req.query.month });
  return apiSuccess(res, result);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const salary = await payroll.update({ tenantId: req.tenantId, id, data: req.body });
  return apiSuccess(res, { salary });
});

const markPaid = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const salary = await payroll.markPaid({ tenantId: req.tenantId, id, paymentMethod: req.body.paymentMethod });
  return apiSuccess(res, { salary });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.query.id || req.params.id;
  const result = await payroll.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

module.exports = { list, getOne, generate, summary, update, markPaid, remove };