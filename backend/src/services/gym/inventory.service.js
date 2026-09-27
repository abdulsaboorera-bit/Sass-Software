"use strict";

const mongoose = require("mongoose");
const { GymInventoryItem, StockMovement } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function list({ tenantId, category, search, lowStock, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
       { name: { $regex: escapeRegex(search), $options: "i" } },
       { sku: { $regex: escapeRegex(search), $options: "i" } },
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
  const existing = await GymInventoryItem.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Inventory item not found");

  const updateData = sanitize(data);
  const requestedQuantity = updateData.quantity;
  delete updateData.quantity;
  let item = await GymInventoryItem.findOneAndUpdate(
    { _id: id, tenantId },
    updateData,
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Inventory item not found");

  if (requestedQuantity !== undefined && requestedQuantity !== existing.quantity) {
    const delta = Number(requestedQuantity) - Number(existing.quantity);
    item = await GymInventoryItem.findOneAndUpdate(
      { _id: id, tenantId, quantity: existing.quantity },
      { $inc: { quantity: delta } },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    if (!item) throw ApiError.conflict("Stock changed while updating this item; please retry");
    try {
      await StockMovement.create({
        tenantId,
        itemId: id,
        type: "ADJUSTMENT",
        quantity: Math.abs(delta),
        unitPrice: Number(item.costPrice || 0),
        totalCost: Math.abs(delta) * Number(item.costPrice || 0),
        notes: `Manual quantity adjustment (${delta > 0 ? "+" : ""}${delta})`,
      });
    } catch (err) {
      await GymInventoryItem.updateOne({ _id: id, tenantId }, { $inc: { quantity: -delta } });
      throw err;
    }
  }
  return item;
}

async function remove({ tenantId, id }) {
  const item = await GymInventoryItem.findOneAndDelete({ _id: id, tenantId });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return { success: true };
}

async function recordMovement({ tenantId, itemId, type, quantity, unitPrice, reference, notes, createdBy }) {
  const qty = Number(quantity);
  const item = await GymInventoryItem.findOne({ _id: itemId, tenantId }).select("name quantity costPrice").lean();
  if (!item) throw ApiError.notFound("Inventory item not found");

  const decreases = type === "SALE" || type === "DAMAGED";
  const delta = decreases ? -qty : qty;
  const updated = await GymInventoryItem.findOneAndUpdate(
    {
      _id: itemId,
      tenantId,
      ...(decreases ? { quantity: { $gte: qty } } : {}),
    },
    { $inc: { quantity: delta } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!updated) {
    if (decreases) throw ApiError.badRequest(`Insufficient stock for "${item.name}" (available: ${item.quantity})`);
    throw ApiError.notFound("Inventory item not found");
  }

  const price = Number(unitPrice ?? item.costPrice);
  try {
    await StockMovement.create({ tenantId, itemId, type, quantity: qty, unitPrice: price, totalCost: price * qty, reference, notes, createdBy });
  } catch (err) {
    await GymInventoryItem.updateOne({ _id: itemId, tenantId }, { $inc: { quantity: -delta } });
    throw err;
  }
  return updated;
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
