"use strict";

const mongoose = require("mongoose");
const { RestaurantInventoryItem, RestaurantStockMovement, Supplier } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const DECREASES = new Set(["SALE", "DAMAGED", "ORDER"]);

async function list({ tenantId, category, search, lowStock, supplierId, page = 1, limit = 100 }) {
  const filter = { tenantId };
  if (category) filter.category = category;
  if (supplierId) filter.supplierId = supplierId;
  if (search) filter.$or = [{ name: { $regex: escapeRegex(search), $options: "i" } }, { sku: { $regex: escapeRegex(search), $options: "i" } }];
  if (lowStock) filter.$expr = { $lte: ["$quantity", "$minStock"] };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    RestaurantInventoryItem.find(filter).populate("supplierId", "name").sort({ name: 1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    RestaurantInventoryItem.countDocuments(filter),
  ]);
  return { items: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const item = await RestaurantInventoryItem.findOne({ _id: id, tenantId }).populate("supplierId", "name").lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

async function create({ tenantId, data }) {
  if (data.supplierId) {
    const supplier = await Supplier.exists({ _id: data.supplierId, tenantId });
    if (!supplier) throw ApiError.badRequest("Invalid supplier");
  }
  const item = await RestaurantInventoryItem.create({ tenantId, ...sanitize(data) });
  if (Number(item.quantity) > 0) {
    await RestaurantStockMovement.create({
      tenantId,
      itemId: item._id,
      type: "PURCHASE",
      quantity: Number(item.quantity),
      unitPrice: Number(item.costPerUnit || 0),
      totalCost: Number(item.quantity) * Number(item.costPerUnit || 0),
      notes: "Opening stock",
    });
  }
  return item.toObject();
}

async function update({ tenantId, id, data }) {
  const existing = await RestaurantInventoryItem.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Inventory item not found");
  if (data.supplierId && !(await Supplier.exists({ _id: data.supplierId, tenantId }))) throw ApiError.badRequest("Invalid supplier");

  const updateData = sanitize(data);
  const requestedQuantity = updateData.quantity;
  delete updateData.quantity;
  let item = await RestaurantInventoryItem.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Inventory item not found");

  if (requestedQuantity !== undefined && requestedQuantity !== existing.quantity) {
    const delta = Number(requestedQuantity) - Number(existing.quantity);
    item = await RestaurantInventoryItem.findOneAndUpdate(
      { _id: id, tenantId, quantity: existing.quantity },
      { $inc: { quantity: delta } },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    if (!item) throw ApiError.conflict("Stock changed while updating this item; please retry");
    try {
      await RestaurantStockMovement.create({
        tenantId,
        itemId: id,
        type: "ADJUSTMENT",
        quantity: Math.abs(delta),
        unitPrice: Number(item.costPerUnit || 0),
        totalCost: Math.abs(delta) * Number(item.costPerUnit || 0),
        notes: `Manual quantity adjustment (${delta > 0 ? "+" : ""}${delta})`,
      });
    } catch (err) {
      await RestaurantInventoryItem.updateOne({ _id: id, tenantId }, { $inc: { quantity: -delta } });
      throw err;
    }
  }
  return item;
}

async function remove({ tenantId, id }) {
  const item = await RestaurantInventoryItem.findOneAndDelete({ _id: id, tenantId });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return { success: true };
}

async function recordMovement({ tenantId, itemId, type, quantity, unitPrice, reference, notes, createdBy }) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw ApiError.badRequest("A positive quantity is required");
  if (!["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"].includes(type)) throw ApiError.badRequest("Invalid movement type");
  const item = await RestaurantInventoryItem.findOne({ _id: itemId, tenantId }).select("name quantity costPerUnit").lean();
  if (!item) throw ApiError.notFound("Inventory item not found");

  const decreases = DECREASES.has(type);
  const delta = decreases ? -qty : qty;
  const updated = await RestaurantInventoryItem.findOneAndUpdate(
    { _id: itemId, tenantId, ...(decreases ? { quantity: { $gte: qty } } : {}) },
    { $inc: { quantity: delta } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!updated) {
    if (decreases) throw ApiError.badRequest(`Insufficient stock for "${item.name}" (available: ${item.quantity})`);
    throw ApiError.notFound("Inventory item not found");
  }

  const price = Number(unitPrice ?? item.costPerUnit);
  try {
    await RestaurantStockMovement.create({ tenantId, itemId, type, quantity: qty, unitPrice: price, totalCost: price * qty, reference, notes, createdBy });
  } catch (err) {
    await RestaurantInventoryItem.updateOne({ _id: itemId, tenantId }, { $inc: { quantity: -delta } });
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
    RestaurantStockMovement.find(filter).populate("itemId", "name category").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    RestaurantStockMovement.countDocuments(filter),
  ]);
  return { movements: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function summary({ tenantId }) {
  const [totalItems, totalValue, lowStockCount, categoryCounts] = await Promise.all([
    RestaurantInventoryItem.countDocuments({ tenantId, isActive: true }),
    RestaurantInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPerUnit"] } } } },
    ]),
    RestaurantInventoryItem.countDocuments({ tenantId, isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } }),
    RestaurantInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 }, value: { $sum: { $multiply: ["$quantity", "$costPerUnit"] } } } },
    ]),
  ]);
  return {
    totalItems,
    totalValue: totalValue[0]?.total || 0,
    lowStockCount,
    byCategory: categoryCounts.map((c) => ({ category: c._id, count: c.count, value: c.value })),
  };
}

module.exports = { list, getById, create, update, remove, recordMovement, movements, summary };