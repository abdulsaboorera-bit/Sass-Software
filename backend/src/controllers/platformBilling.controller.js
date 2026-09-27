"use strict";

const { z } = require("zod");
const billingService = require("../services/platformBilling.service");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { PLANS } = require("../config/plans");

const recordPaymentSchema = z.object({
  tenantId: z.string().min(1),
  package: z.enum(["MONTHLY", "SEMIANNUAL", "ANNUAL"]),
  method: z.string().optional(),
  notes: z.string().optional(),
});

const plans = asyncHandler(async (_req, res) => apiSuccess(res, { plans: PLANS }));

const list = asyncHandler(async (_req, res) => {
  const rows = await billingService.listAll();
  return apiSuccess(res, { subscriptions: rows });
});

const history = asyncHandler(async (req, res) => {
  const rows = await billingService.history({ tenantId: req.params.tenantId });
  return apiSuccess(res, { history: rows });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = recordPaymentSchema.parse(req.body);
  const row = await billingService.recordPayment(data);
  return apiSuccess(res, { subscription: row }, 201);
});

module.exports = { plans, list, history, recordPayment };
