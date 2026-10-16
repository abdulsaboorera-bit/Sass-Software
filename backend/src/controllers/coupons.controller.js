"use strict";

const { Coupon } = require("../models");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { paginate } = require("../utils/query");
const { sanitize } = require("../utils/crud");
const couponService = require("../services/coupon.service");

/** GET /api/coupons */
async function list(req, res) {
  const { page, limit } = paginate(req.query, { maxLimit: 200 });
  const filter = { tenantId: req.tenantId };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
  if (req.query.search) filter.$or = [{ code: new RegExp(req.query.search, "i") }, { description: new RegExp(req.query.search, "i") }];
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);
  return apiSuccess(res, { coupons, pagination: { page, limit, total } });
}

/** POST /api/coupons */
async function create(req, res) {
  const payload = { ...sanitize(req.body), tenantId: req.tenantId };
  if (!payload.code) throw ApiError.badRequest("code is required");
  payload.code = String(payload.code).trim().toUpperCase();
  const coupon = await Coupon.create(payload);
  return apiSuccess(res, { coupon }, 201);
}

/** PATCH /api/coupons/:id */
async function update(req, res) {
  const updates = sanitize(req.body);
  if (updates.code) updates.code = String(updates.code).trim().toUpperCase();
  const coupon = await Coupon.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true }
  ).lean();
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return apiSuccess(res, { coupon });
}

/** DELETE /api/coupons/:id */
async function remove(req, res) {
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return apiSuccess(res, { success: true });
}

/** POST /api/coupons/validate  { code, amount } */
async function validate(req, res) {
  const { code, amount } = req.body || {};
  const result = await couponService.validateCoupon(req.tenantId, code, amount);
  return apiSuccess(res, result);
}

/** POST /api/coupons/:id/redeem */
async function redeem(req, res) {
  const coupon = await couponService.redeemCoupon(req.tenantId, req.params.id);
  return apiSuccess(res, { coupon });
}

module.exports = { list, create, update, remove, validate, redeem };
