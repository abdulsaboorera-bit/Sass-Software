"use strict";

const { z } = require("zod");
const billingService = require("../../services/gym/billing.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const invoiceSchema = z.object({
  memberId: z.string().min(1),
  type: z.enum(["MEMBERSHIP", "RENEWAL", "PERSONAL_TRAINING", "PRODUCT", "OTHER"]).optional(),
  planId: z.string().optional(),
  amount: z.number().nonnegative(),
  dueDate: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string().optional(),
  memberId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]),
  reference: z.string().optional(),
  type: z.string().optional(),
  paidAt: z.string().optional(),
}).refine((data) => data.invoiceId || data.memberId, {
  message: "At least one of invoiceId or memberId is required",
});

const paymentUpdateSchema = z.object({
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(),
  reference: z.string().optional(),
  type: z.string().optional(),
  paidAt: z.string().optional(),
  amount: z.number().positive().optional(),
});

const createInvoice = asyncHandler(async (req, res) => {
  const data = invoiceSchema.parse(req.body);
  const invoice = await billingService.createInvoice({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { invoice }, 201);
});

const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await billingService.listInvoices({
    tenantId: req.tenantId,
    memberId: req.query.memberId,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const listPayments = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await billingService.listPayments({
    tenantId: req.tenantId,
    memberId: req.query.memberId,
    invoiceId: req.query.invoiceId,
    method: req.query.method,
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.getInvoice({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { invoice });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = paymentSchema.parse(req.body);
  const result = await billingService.recordPayment({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

const updatePayment = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const data = paymentUpdateSchema.parse(req.body);
  const payment = await billingService.updatePayment({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { payment });
});

const deletePayment = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await billingService.deletePayment({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.cancelInvoice({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { invoice });
});

const markOverdue = asyncHandler(async (req, res) => {
  const result = await billingService.markOverdue({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { createInvoice, listInvoices, listPayments, getInvoice, recordPayment, updatePayment, deletePayment, cancelInvoice, markOverdue };
