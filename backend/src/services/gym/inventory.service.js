"use strict";

const mongoose = require("mongoose");
const { GymInventoryItem, StockMovement } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function list({ tenantId, category, search, lowStock, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }
  if (lowStock) {
    filter.$expr = { $lte: ["$quantity", "$minStock"] };
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    GymInventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    GymInventoryItem.countDocuments(filter),
  ]);
  return { items: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const item = await GymInventoryItem.findOne({ _id: id, tenantId }).lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

async function create({ tenantId, data }) {
  const item = await GymInventoryItem.create({ tenantId, ...data });
  return item.toObject();
}

async function update({ tenantId, id, data }) {
  const item = await GymInventoryItem.findOneAndUpdate({ _id: id, tenantId }, data, { new: true }).lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

async function remove({ tenantId, id }) {
  const item = await GymInventoryItem.findOneAndDelete({ _id: id, tenantId });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return { success: true };
}

async function recordMovement({ tenantId, itemId, type, quantity, unitPrice, reference, notes, createdBy }) {
  const item = await GymInventoryItem.findOne({ _id: itemId, tenantId });
  if (!item) throw ApiError.notFound("Inventory item not found");

  const qty = Number(quantity);
  const totalCost = Number(unitPrice || item.costPrice) * qty;

  if (type === "SALE" || type === "DAMAGED") {
    if (item.quantity < qty) throw ApiError.badRequest(`Insufficient stock for "${item.name}" (available: ${item.quantity})`);
    item.quantity -= qty;
  } else {
    item.quantity += qty;
  }
  await item.save();

  await StockMovement.create({ tenantId, itemId, type, quantity: qty, unitPrice: Number(unitPrice || item.costPrice), totalCost, reference, notes, createdBy });
  return item.toObject();
}

async function movements({ tenantId, itemId, type, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (itemId) filter.itemId = itemId;
  if (type) filter.type = type;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    StockMovement.find(filter).populate("itemId", "name category").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    StockMovement.countDocuments(filter),
  ]);
  return { movements: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function lowStockAlerts({ tenantId }) {
  const items = await GymInventoryItem.find({ tenantId, isActive: true })
    .match({ $expr: { $lte: ["$quantity", "$minStock"] } })
    .sort({ quantity: 1 })
    .lean({ virtuals: true });
  return items;
}

async function summary({ tenantId }) {
  const [totalItems, totalValue, lowStockCount, categoryCounts] = await Promise.all([
    GymInventoryItem.countDocuments({ tenantId, isActive: true }),
    GymInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
    GymInventoryItem.countDocuments({
      tenantId,
      isActive: true,
      $expr: { $lte: ["$quantity", "$minStock"] },
    }),
    GymInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 }, value: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
  ]);
  return {
    totalItems,
    totalValue: totalValue[0]?.total || 0,
    lowStockCount,
    byCategory: categoryCounts.map((c) => ({ category: c._id, count: c.count, value: c.value })),
  };
}

module.exports = { list, getById, create, update, remove, recordMovement, movements, lowStockAlerts, summary };
