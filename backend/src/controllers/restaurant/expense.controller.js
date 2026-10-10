"use strict";

const mongoose = require("mongoose");
const express = require("express");
const { RestaurantExpense } = require("../../models");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");
const { makeCrudRouter } = require("../../utils/crud");

const router = express.Router();

const summary = asyncHandler(async (req, res) => {
  const match = { tenantId: mongoose.Types.ObjectId(String(req.tenantId)) };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const [rows, byCategory] = await Promise.all([
    RestaurantExpense.aggregate([
      { $match: { ...match, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    RestaurantExpense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);
  return apiSuccess(res, {
    currentMonth: rows[0]?.total || 0,
    monthCount: rows[0]?.count || 0,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
  });
});

router.get("/summary", summary);

router.use(
  "/",
  makeCrudRouter({
    model: RestaurantExpense,
    permission: "expenses",
    listKey: "expenses",
    itemKey: "expense",
    searchFields: ["description", "reference"],
    filterFields: ["category", "status", "paymentMethod"],
    sort: { date: -1 },
  })
);

module.exports = router;