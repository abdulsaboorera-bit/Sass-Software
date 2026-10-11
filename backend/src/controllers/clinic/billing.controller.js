"use strict";

const { z } = require("zod");
const billing = require("../../services/clinic/billing.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

const invoiceSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  type: z.enum(["CONSULTATION", "PROCEDURE", "LAB", "PHARMACY", "SERVICE", "OTHER"]).optional(),
  amount: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  items: z.array(z.any()).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z
  .object({
    invoiceId: z.string().optional(),
    patientId: z.string().optional(),
    amount: z.number().positive(),
    method: z.enum(METHODS),
    reference: z.string().optional(),
    type: z.string().optional(),
    paidAt: z.string().optional(),
  })
  .refine((d) => d.invoiceId || d.patientId, { message: "invoiceId or patientId is required" });

const createInvoice = asyncHandler(async (req, res) => {
  const data = invoiceSchema.parse(req.body);
  const invoice = await billing.createInvoice({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, { invoice }, 201);
});

const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await billing.listInvoices({ tenantId: req.tenantId, patientId: req.query.patientId, status: req.query.status, from: req.query.from, to: req.query.to, page, limit });
  return apiSuccess(res, result);
});

const listPayments = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const result = await billing.listPayments({ tenantId: req.tenantId, patientId: req.query.patientId, invoiceId: req.query.invoiceId, method: req.query.method, page, limit });
  return apiSuccess(res, result);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await billing.getInvoice({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { invoice });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = paymentSchema.parse(req.body);
  const result = await billing.recordPayment({ tenantId: req.tenantId, ...data });
  return apiSuccess(res, result, 201);
});

const updatePayment = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id;
  if (!id) throw ApiError.badRequest("id is required");
  const payment = await billing.updatePayment({ tenantId: req.tenantId, id, data: req.body });
  return apiSuccess(res, { payment });
});

const deletePayment = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) throw ApiError.badRequest("id is required");
  const result = await billing.deletePayment({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await billing.cancelInvoice({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { invoice });
});

const markOverdue = asyncHandler(async (req, res) => {
  const result = await billing.markOverdue({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { createInvoice, listInvoices, listPayments, getInvoice, recordPayment, updatePayment, deletePayment, cancelInvoice, markOverdue };
