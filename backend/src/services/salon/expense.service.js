"use strict";

const mongoose = require("mongoose");
const { SalonExpense } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { parseDateInput } = require("../../utils/dates");
const { sanitize } = require("../../utils/crud");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function list({ tenantId, category, status, from, to, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
    filter.date = {};
    if (start) filter.date.$gte = start;
    if (end) filter.date.$lte = end;
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    SalonExpense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    SalonExpense.countDocuments(filter),
  ]);
  return { expenses: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const expense = await SalonExpense.findOne({ _id: id, tenantId }).lean({ virtuals: true });
  if (!expense) throw ApiError.notFound("Expense not found");
  return expense;
}

async function create({ tenantId, data }) {
  const expense = await SalonExpense.create({ tenantId, ...sanitize(data) });
  return expense.toObject();
}

async function update({ tenantId, id, data }) {
  const updates = sanitize(data);
  if (updates.date) updates.date = new Date(updates.date);
  const expense = await SalonExpense.findOneAndUpdate({ _id: id, tenantId }, updates, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!expense) throw ApiError.notFound("Expense not found");
  return expense;
}

async function remove({ tenantId, id }) {
  const expense = await SalonExpense.findOneAndDelete({ _id: id, tenantId });
  if (!expense) throw ApiError.notFound("Expense not found");
  return { success: true };
}

async function summary({ tenantId, from, to }) {
  const match = { tenantId: oid(tenantId) };
  const start = parseDateInput(from);
  const end = parseDateInput(to, true);
  if (start || end) {
    match.date = {};
    if (start) match.date.$gte = start;
    if (end) match.date.$lte = end;
  }
  const [row] = await SalonExpense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const byCategory = await SalonExpense.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return {
    total: row?.total || 0,
    count: row?.count || 0,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
  };
}

module.exports = { list, getById, create, update, remove, summary };
