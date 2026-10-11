"use strict";

const mongoose = require("mongoose");
const { Medicine, PharmacyStockMovement } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function list({ tenantId, categoryId, form, search, lowStock, expiringSoon, page = 1, limit = 100 }) {
  const filter = { tenantId };
  if (categoryId) filter.categoryId = categoryId;
  if (form) filter.form = form;
  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { genericName: { $regex: escapeRegex(search), $options: "i" } },
      { sku: { $regex: escapeRegex(search), $options: "i" } },
      { barcode: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }
  if (lowStock) filter.$expr = { $lte: ["$quantity", "$minStock"] };
  if (expiringSoon) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 90);
    filter.expiryDate = { $ne: null, $lte: soon };
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Medicine.find(filter).populate("category", "name").sort({ name: 1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Medicine.countDocuments(filter),
  ]);
  return { medicines: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getById({ tenantId, id }) {
  const item = await Medicine.findOne({ _id: id, tenantId }).populate("category", "name").lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Medicine not found");
  return item;
}

async function create({ tenantId, data }) {
  const item = await Medicine.create({ tenantId, ...sanitize(data) });
  return item.toObject();
}

async function update({ tenantId, id, data }) {
  const existing = await Medicine.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Medicine not found");

  const updateData = sanitize(data);
  const requestedQuantity = updateData.quantity;
  delete updateData.quantity;
  let item = await Medicine.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!item) throw ApiError.notFound("Medicine not found");

  if (requestedQuantity !== undefined && Number(requestedQuantity) !== Number(existing.quantity)) {
    const delta = Number(requestedQuantity) - Number(existing.quantity);
    item = await Medicine.findOneAndUpdate(
      { _id: id, tenantId, quantity: existing.quantity },
      { $inc: { quantity: delta } },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    if (!item) throw ApiError.conflict("Stock changed while updating this medicine; please retry");
    try {
      await PharmacyStockMovement.create({
        tenantId,
        medicineId: id,
        type: "ADJUSTMENT",
        quantity: Math.abs(delta),
        unitPrice: Number(item.costPrice || 0),
        totalCost: Math.abs(delta) * Number(item.costPrice || 0),
        notes: `Manual quantity adjustment (${delta > 0 ? "+" : ""}${delta})`,
      });
    } catch (err) {
      await Medicine.updateOne({ _id: id, tenantId }, { $inc: { quantity: -delta } });
      throw err;
    }
  }
  return item;
}

async function remove({ tenantId, id }) {
  const item = await Medicine.findOneAndDelete({ _id: id, tenantId });
  if (!item) throw ApiError.notFound("Medicine not found");
  return { success: true };
}

async function recordMovement({ tenantId, medicineId, type, quantity, unitPrice, reference, notes, createdBy }) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw ApiError.badRequest("A positive quantity is required");
  const item = await Medicine.findOne({ _id: medicineId, tenantId }).select("name quantity costPrice").lean();
  if (!item) throw ApiError.notFound("Medicine not found");

  const decreases = type === "SALE" || type === "DAMAGED" || type === "EXPIRED";
  const delta = decreases ? -qty : qty;
  const updated = await Medicine.findOneAndUpdate(
    { _id: medicineId, tenantId, ...(decreases ? { quantity: { $gte: qty } } : {}) },
    { $inc: { quantity: delta } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
  if (!updated) {
    if (decreases) throw ApiError.badRequest(`Insufficient stock for "${item.name}" (available: ${item.quantity})`);
    throw ApiError.notFound("Medicine not found");
  }

  const price = Number(unitPrice ?? item.costPrice);
  try {
    await PharmacyStockMovement.create({ tenantId, medicineId, type, quantity: qty, unitPrice: price, totalCost: price * qty, reference, notes, createdBy });
  } catch (err) {
    await Medicine.updateOne({ _id: medicineId, tenantId }, { $inc: { quantity: -delta } });
    throw err;
  }
  return updated;
}

async function movements({ tenantId, medicineId, type, page = 1, limit = 50 }) {
  const filter = { tenantId };
  if (medicineId) filter.medicineId = medicineId;
  if (type) filter.type = type;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    PharmacyStockMovement.find(filter).populate("medicineId", "name form").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    PharmacyStockMovement.countDocuments(filter),
  ]);
  return { movements: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function summary({ tenantId }) {
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  const [totalItems, totalValue, lowStockCount, expiredCount, expiringSoonCount, byForm] = await Promise.all([
    Medicine.countDocuments({ tenantId, isActive: true }),
    Medicine.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
    Medicine.countDocuments({ tenantId, isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } }),
    Medicine.countDocuments({ tenantId, isActive: true, expiryDate: { $ne: null, $lt: new Date() } }),
    Medicine.countDocuments({ tenantId, isActive: true, expiryDate: { $ne: null, $gte: new Date(), $lte: soon } }),
    Medicine.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: "$form", count: { $sum: 1 }, value: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } },
    ]),
  ]);
  return {
    totalItems,
    totalValue: totalValue[0]?.total || 0,
    lowStockCount,
    expiredCount,
    expiringSoonCount,
    byForm: byForm.map((c) => ({ form: c._id, count: c.count, value: c.value })),
  };
}

module.exports = { list, getById, create, update, remove, recordMovement, movements, summary };
