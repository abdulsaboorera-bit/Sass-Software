"use strict";

const { PharmacySale, PharmacyStockMovement, Medicine, Patient, Prescription } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");
const { parseDateInput } = require("../../utils/dates");

function normaliseItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest("At least one item is required");
  return items.map((raw) => {
    const quantity = Number(raw.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw ApiError.badRequest("Each item needs a positive quantity");
    return { medicineId: raw.medicineId, quantity: Math.floor(quantity) };
  });
}

/**
 * Create a pharmacy sale, deduct stock for each line, log SALE movements and
 * (optionally) mark a linked prescription DISPENSED. Stock is deducted with a
 * conditional update per item and rolled back if any line fails.
 */
async function createSale({ tenantId, patientId, prescriptionId, customerName, items, discount = 0, tax = 0, paymentMethod = "CASH", paidAmount, notes, soldBy }) {
  const lines = normaliseItems(items);
  if (patientId) {
    const patient = await Patient.findOne({ _id: patientId, tenantId }).select("_id").lean();
    if (!patient) throw ApiError.notFound("Patient not found");
  }
  if (prescriptionId) {
    const rx = await Prescription.findOne({ _id: prescriptionId, tenantId }).select("_id").lean();
    if (!rx) throw ApiError.notFound("Prescription not found");
  }

  // Resolve medicines + prices.
  const ids = lines.map((l) => l.medicineId);
  const medicines = await Medicine.find({ _id: { $in: ids }, tenantId }).lean();
  const byId = new Map(medicines.map((m) => [String(m._id), m]));
  const saleItems = lines.map((l) => {
    const med = byId.get(String(l.medicineId));
    if (!med) throw ApiError.badRequest("One or more medicines are invalid");
    return {
      medicineId: med._id,
      name: med.name,
      quantity: l.quantity,
      unitPrice: Number(med.sellPrice || 0),
      costPrice: Number(med.costPrice || 0),
      total: Number(med.sellPrice || 0) * l.quantity,
    };
  });

  const subtotal = saleItems.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));
  const paid = paidAmount === undefined || paidAmount === null ? total : Number(paidAmount);
  if (!Number.isFinite(paid) || paid < 0) throw ApiError.badRequest("Invalid paid amount");
  const status = paid <= 0 ? "PENDING" : paid >= total ? "PAID" : "PARTIAL";

  // Deduct stock with rollback on failure.
  const deducted = [];
  try {
    for (const item of saleItems) {
      const updated = await Medicine.findOneAndUpdate(
        { _id: item.medicineId, tenantId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      ).lean();
      if (!updated) {
        const med = byId.get(String(item.medicineId));
        throw ApiError.badRequest(`Insufficient stock for "${item.name}" (available: ${med?.quantity ?? 0})`);
      }
      deducted.push(item);
    }
  } catch (err) {
    for (const item of deducted) {
      await Medicine.updateOne({ _id: item.medicineId, tenantId }, { $inc: { quantity: item.quantity } });
    }
    throw err;
  }

  let sale;
  try {
    sale = await PharmacySale.create({
      tenantId,
      saleRef: invoiceRef("PHM"),
      patientId: patientId || null,
      prescriptionId: prescriptionId || null,
      customerName,
      items: saleItems,
      subtotal,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      total,
      paidAmount: paid,
      status,
      paymentMethod,
      soldAt: new Date(),
      soldBy: soldBy || null,
      notes,
    });
  } catch (err) {
    for (const item of deducted) {
      await Medicine.updateOne({ _id: item.medicineId, tenantId }, { $inc: { quantity: item.quantity } });
    }
    throw err;
  }

  await PharmacyStockMovement.insertMany(
    saleItems.map((i) => ({
      tenantId,
      medicineId: i.medicineId,
      type: "SALE",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalCost: i.total,
      reference: sale.saleRef,
    }))
  );

  if (prescriptionId) {
    await Prescription.updateOne({ _id: prescriptionId, tenantId }, { $set: { status: "DISPENSED" } });
  }

  return sale.toObject();
}

async function listSales({ tenantId, patientId, from, to, status, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    if ((from && !start) || (to && !end)) throw ApiError.badRequest("Invalid date range");
    filter.soldAt = {};
    if (start) filter.soldAt.$gte = start;
    if (end) filter.soldAt.$lte = end;
  }
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    PharmacySale.find(filter).populate("patientId", "name patientNo").sort({ soldAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    PharmacySale.countDocuments(filter),
  ]);
  return { sales: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getSale({ tenantId, id }) {
  const sale = await PharmacySale.findOne({ _id: id, tenantId }).populate("patientId", "name patientNo phone").lean({ virtuals: true });
  if (!sale) throw ApiError.notFound("Sale not found");
  return sale;
}

async function cancelSale({ tenantId, id }) {
  const sale = await PharmacySale.findOne({ _id: id, tenantId });
  if (!sale) throw ApiError.notFound("Sale not found");
  if (sale.status === "CANCELLED") throw ApiError.badRequest("Sale is already cancelled");
  for (const item of sale.items) {
    await Medicine.updateOne({ _id: item.medicineId, tenantId }, { $inc: { quantity: item.quantity } });
    await PharmacyStockMovement.create({
      tenantId,
      medicineId: item.medicineId,
      type: "RETURN",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalCost: item.total,
      reference: sale.saleRef,
      notes: "Sale cancelled",
    });
  }
  sale.status = "CANCELLED";
  await sale.save();
  return sale.toObject();
}

async function summary({ tenantId, from, to }) {
  const filter = { tenantId };
  if (from || to) {
    const start = parseDateInput(from);
    const end = parseDateInput(to, true);
    filter.soldAt = {};
    if (start) filter.soldAt.$gte = start;
    if (end) filter.soldAt.$lte = end;
  }
  const rows = await PharmacySale.aggregate([
    { $match: { ...filter, tenantId: new (require("mongoose").Types.ObjectId)(String(tenantId)), status: { $ne: "CANCELLED" } } },
    { $group: { _id: null, total: { $sum: "$total" }, paid: { $sum: "$paidAmount" }, count: { $sum: 1 } } },
  ]);
  const r = rows[0] || { total: 0, paid: 0, count: 0 };
  return { totalSales: r.total, collected: r.paid, outstanding: +(r.total - r.paid).toFixed(2), count: r.count };
}

module.exports = { createSale, listSales, getSale, cancelSale, summary };
