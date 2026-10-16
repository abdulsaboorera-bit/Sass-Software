"use strict";

const { Coupon } = require("../models");
const { ApiError } = require("../utils/apiResponse");

/** Round to 2 decimals without float noise. */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Validate a coupon against an order amount and compute the discount.
 * Works for every vertical — coupons are tenant-scoped, not industry-specific.
 */
async function validateCoupon(tenantId, code, amount) {
  if (!code) throw ApiError.badRequest("Coupon code is required");
  const coupon = await Coupon.findOne({ tenantId, code: String(code).trim().toUpperCase() }).lean();
  if (!coupon) throw ApiError.notFound("Coupon not found");
  if (!coupon.isActive) throw ApiError.badRequest("Coupon is inactive");

  const now = new Date();
  if (coupon.startDate && now < new Date(coupon.startDate)) throw ApiError.badRequest("Coupon is not yet valid");
  if (coupon.endDate && now > new Date(coupon.endDate)) throw ApiError.badRequest("Coupon has expired");
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest("Coupon usage limit reached");

  const orderAmount = Number(amount) || 0;
  if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
    throw ApiError.badRequest(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }

  let discount = coupon.type === "PERCENT" ? orderAmount * (coupon.value / 100) : coupon.value;
  if (coupon.type === "PERCENT" && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  if (orderAmount > 0) discount = Math.min(discount, orderAmount);

  return {
    coupon: { id: coupon._id, code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
    discount: round2(discount),
    total: round2(Math.max(0, orderAmount - discount)),
  };
}

/** Increment a coupon's usage counter (called after a successful order). */
async function redeemCoupon(tenantId, id) {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { $inc: { usedCount: 1 } },
    { new: true }
  ).lean();
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return coupon;
}

module.exports = { validateCoupon, redeemCoupon };
