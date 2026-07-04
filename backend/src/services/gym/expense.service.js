"use strict";

const mongoose = require("mongoose");
const { Expense } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function list({ tenantId, category, status, from, to, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Expense.countDocuments(filter),
  ]);
  return { expenses: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const expense = await Expense.findOne({ _id: id, tenantId }).lean({ virtuals: true });
  if (!expense) throw ApiError.notFound("Expense not found");
  return expense;
}

async function create({ tenantId, data }) {
  const expense = await Expense.create({ tenantId, ...data });
  return expense.toObject();
}

async function update({ tenantId, id, data }) {
  const expense = await Expense.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }).lean({ virtuals: true });
  if (!expense) throw ApiError.notFound("Expense not found");
  return expense;
}

async function remove({ tenantId, id }) {
  const expense = await Expense.findOneAndDelete({ _id: id, tenantId });
  if (!expense) throw ApiError.notFound("Expense not found");
  return { success: true };
}

async function summary({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const [totalExpenses, byCategory, byMonth] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);
  return {
    totalAmount: totalExpenses[0]?.total || 0,
    totalCount: totalExpenses[0]?.count || 0,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    byMonth: byMonth.map((m) => ({ year: m._id.year, month: m._id.month, total: m.total, count: m.count })),
  };
}

module.exports = { list, getById, create, update, remove, summary };
