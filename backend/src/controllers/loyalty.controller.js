"use strict";

const { LoyaltyTransaction } = require("../models");
const { apiSuccess } = require("../utils/apiResponse");
const { paginate } = require("../utils/query");
const loyalty = require("../services/loyalty.service");

/** GET /api/loyalty — ledger, newest first, optionally filtered by customer. */
async function list(req, res) {
  const { page, limit } = paginate(req.query, { maxLimit: 200 });
  const filter = { tenantId: req.tenantId };
  if (req.query.customerType) filter.customerType = req.query.customerType;
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.type) filter.type = req.query.type;

  const [transactions, total] = await Promise.all([
    LoyaltyTransaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    LoyaltyTransaction.countDocuments(filter),
  ]);
  return apiSuccess(res, { transactions, pagination: { page, limit, total } });
}

/** POST /api/loyalty/adjust — award or redeem points for a customer. */
async function adjust(req, res) {
  const { customerType, customerId, points, type, reason, orderRef } = req.body || {};
  const result = await loyalty.adjustPoints({
    tenantId: req.tenantId,
    customerType,
    customerId,
    points,
    type,
    reason,
    orderRef,
  });
  return apiSuccess(res, result, 201);
}

module.exports = { list, adjust };
