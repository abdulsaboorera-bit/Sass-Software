"use strict";

const { FeePayment } = require("../../models");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

/** GET /api/school/fees?month&status&studentId -> { payments, summary, pagination } */
const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const filter = { tenantId: req.tenantId };
  if (req.query.month) filter.month = req.query.month;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.studentId) filter.studentId = req.query.studentId;

  const [rows, total, all] = await Promise.all([
    FeePayment.find(filter).populate("student", "name admissionNo").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    FeePayment.countDocuments(filter),
    FeePayment.find(filter).select("amount status").lean(),
  ]);

  const summary = all.reduce(
    (s, p) => {
      s.totalAmount += Number(p.amount || 0);
      s.totalCount += 1;
      if (p.status === "PAID") s.paidCount += 1;
      else if (p.status === "PENDING") s.pendingCount += 1;
      return s;
    },
    { totalAmount: 0, totalCount: 0, paidCount: 0, pendingCount: 0 }
  );

  return apiSuccess(res, { payments: rows, summary, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/** POST /api/school/fees  body: { studentId, amount, month, year, method } -> { payment } (marked PAID) */
const create = asyncHandler(async (req, res) => {
  const { studentId, amount, month, year, method, remarks } = req.body;
  const payment = await FeePayment.create({
    tenantId: req.tenantId,
    studentId,
    amount,
    month,
    year,
    method,
    remarks,
    status: "PAID",
    paidAt: new Date(),
  });
  return apiSuccess(res, { payment }, 201);
});

module.exports = { list, create };
