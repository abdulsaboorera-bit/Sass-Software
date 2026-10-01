"use strict";

const mongoose = require("mongoose");
const {
  Property, PropertyUnit, LeaseTenant, Lease, RentPayment,
  PropertyExpense, MaintenanceRequest, Vendor, PropertyDocument, PropertyTask,
} = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const rentStatusFor = (billed, paid) => (paid >= billed && billed > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID");

// ── Properties ──────────────────────────────────────────
async function listProperties({ tenantId, search, type, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (type) filter.type = type;
  if (search) filter.$or = ["name", "address", "city"].map((field) => ({ [field]: { $regex: escape(search), $options: "i" } }));
  const skip = (page - 1) * limit;
  const [properties, total, unitCounts] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Property.countDocuments(filter),
    PropertyUnit.aggregate([{ $match: { tenantId: oid(tenantId), isActive: true } }, { $group: { _id: "$propertyId", total: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ["$status", "OCCUPIED"] }, 1, 0] } } } }]),
  ]);
  const counts = new Map(unitCounts.map((row) => [String(row._id), row]));
  return {
    properties: properties.map((property) => {
      const row = counts.get(String(property._id));
      return { ...property, unitsCount: row?.total || 0, occupiedUnits: row?.occupied || 0 };
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function createProperty({ tenantId, data }) {
  return (await Property.create({ tenantId, ...data })).toObject();
}

async function updateProperty({ tenantId, id, data }) {
  const property = await Property.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean();
  if (!property) throw ApiError.notFound("Property not found");
  return property;
}

async function archiveProperty({ tenantId, id }) {
  const activeLease = await Lease.exists({ tenantId, propertyId: id, status: { $in: ["PENDING", "ACTIVE"] } });
  if (activeLease) throw ApiError.badRequest("A property with active leases cannot be archived");
  const property = await Property.findOneAndUpdate({ _id: id, tenantId }, { isActive: false }, { new: true });
  if (!property) throw ApiError.notFound("Property not found");
  await PropertyUnit.updateMany({ tenantId, propertyId: id, isActive: true }, { $set: { isActive: false, status: "NOT_AVAILABLE" } });
  return { success: true };
}

// ── Units ───────────────────────────────────────────────
async function listUnits({ tenantId, propertyId, status, search, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (propertyId) filter.propertyId = propertyId;
  if (status) filter.status = status;
  if (search) filter.unitNo = { $regex: escape(search), $options: "i" };
  const skip = (page - 1) * limit;
  const [units, total] = await Promise.all([
    PropertyUnit.find(filter).populate("propertyId", "name city type").sort({ propertyId: 1, unitNo: 1 }).skip(skip).limit(limit).lean(),
    PropertyUnit.countDocuments(filter),
  ]);
  return { units, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createUnit({ tenantId, data }) {
  const property = await Property.findOne({ _id: data.propertyId, tenantId, isActive: true });
  if (!property) throw ApiError.notFound("Property not found");
  return (await PropertyUnit.create({ tenantId, ...data, unitNo: data.unitNo.toUpperCase() })).toObject();
}

async function updateUnit({ tenantId, id, data }) {
  if (data.status === "VACANT") {
    const activeLease = await Lease.exists({ tenantId, unitId: id, status: { $in: ["PENDING", "ACTIVE"] } });
    if (activeLease) throw ApiError.badRequest("Unit has an active lease and cannot be marked vacant");
  }
  const unit = await PropertyUnit.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean();
  if (!unit) throw ApiError.notFound("Unit not found");
  return unit;
}

async function archiveUnit({ tenantId, id }) {
  const activeLease = await Lease.exists({ tenantId, unitId: id, status: { $in: ["PENDING", "ACTIVE"] } });
  if (activeLease) throw ApiError.badRequest("A unit with an active lease cannot be archived");
  const unit = await PropertyUnit.findOneAndUpdate({ _id: id, tenantId }, { isActive: false, status: "NOT_AVAILABLE" }, { new: true });
  if (!unit) throw ApiError.notFound("Unit not found");
  return { success: true };
}

// ── Tenants ─────────────────────────────────────────────
async function listTenants({ tenantId, search, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (search) {
    const safe = escape(search);
    filter.$or = [{ name: { $regex: safe, $options: "i" } }, { phone: { $regex: safe, $options: "i" } }, { nationalId: { $regex: safe, $options: "i" } }];
  }
  const skip = (page - 1) * limit;
  const [tenants, total] = await Promise.all([
    LeaseTenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LeaseTenant.countDocuments(filter),
  ]);
  return { tenants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createTenant({ tenantId, data }) {
  return (await LeaseTenant.create({ tenantId, ...data })).toObject();
}

async function updateTenant({ tenantId, id, data }) {
  const tenant = await LeaseTenant.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean();
  if (!tenant) throw ApiError.notFound("Tenant not found");
  return tenant;
}

// ── Leases ──────────────────────────────────────────────
async function listLeases({ tenantId, status, propertyId, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (status) filter.status = status;
  if (propertyId) filter.propertyId = propertyId;
  const skip = (page - 1) * limit;
  const [leases, total] = await Promise.all([
    Lease.find(filter)
      .populate("propertyId", "name city")
      .populate("unitId", "unitNo status")
      .populate("leaseTenantId", "name phone")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Lease.countDocuments(filter),
  ]);
  return { leases, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getLease({ tenantId, id }) {
  const lease = await Lease.findOne({ _id: id, tenantId })
    .populate("propertyId", "name city address")
    .populate("unitId", "unitNo type status")
    .populate("leaseTenantId", "name phone email nationalId")
    .lean({ virtuals: true });
  if (!lease) throw ApiError.notFound("Lease not found");
  const payments = await RentPayment.find({ tenantId, leaseId: id }).sort({ paidAt: -1 }).lean();
  return { ...lease, payments };
}

async function createLease({ tenantId, data }) {
  const [unit, leaseTenant] = await Promise.all([
    PropertyUnit.findOne({ _id: data.unitId, tenantId, isActive: true }),
    LeaseTenant.findOne({ _id: data.leaseTenantId, tenantId, isActive: true }),
  ]);
  if (!unit) throw ApiError.notFound("Unit not found");
  if (!leaseTenant) throw ApiError.notFound("Tenant not found");
  if (unit.status !== "VACANT") throw ApiError.badRequest("Unit is not vacant");
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) throw ApiError.badRequest("Lease dates are invalid");
  const rentAmount = Number(data.rentAmount ?? unit.rentAmount);
  const months = Math.max(1, Math.ceil((endDate - startDate) / (30 * 86400000)));
  const totalBilled = rentAmount * months;
  const lease = await Lease.create({
    tenantId, leaseNo: invoiceRef("LSE"), propertyId: unit.propertyId, unitId: unit._id, leaseTenantId: leaseTenant._id,
    startDate, endDate, dueDay: data.dueDay ?? 1, rentAmount, months, totalBilled,
    depositAmount: data.depositAmount || 0, depositPaid: data.depositPaid || 0, amountPaid: 0,
    rentStatus: "UNPAID", status: "ACTIVE", notes: data.notes,
  });
  try {
    await PropertyUnit.updateOne({ _id: unit._id, tenantId, status: "VACANT" }, { $set: { status: "OCCUPIED" } });
    if (Number(data.paymentAmount || 0) > 0) {
      await recordPayment({ tenantId, leaseId: lease._id, amount: data.paymentAmount, method: data.paymentMethod || "CASH", reference: data.reference });
    }
  } catch (error) {
    await Lease.deleteOne({ _id: lease._id, tenantId });
    throw error;
  }
  return getLease({ tenantId, id: lease._id });
}

async function updateLease({ tenantId, id, data }) {
  const lease = await Lease.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!lease) throw ApiError.notFound("Lease not found");
  return lease;
}

async function terminateLease({ tenantId, id }) {
  const lease = await Lease.findOneAndUpdate({ _id: id, tenantId, status: { $in: ["PENDING", "ACTIVE"] } }, { $set: { status: "TERMINATED", terminatedAt: new Date() } }, { new: true });
  if (!lease) throw ApiError.notFound("Terminatable lease not found");
  await PropertyUnit.updateOne({ _id: lease.unitId, tenantId }, { $set: { status: "VACANT" } });
  return getLease({ tenantId, id });
}

// ── Payments ────────────────────────────────────────────
async function recordPayment({ tenantId, leaseId, amount, method, reference }) {
  const lease = await Lease.findOne({ _id: leaseId, tenantId });
  if (!lease) throw ApiError.notFound("Lease not found");
  if (["TERMINATED"].includes(lease.status)) throw ApiError.badRequest("Cannot pay a terminated lease");
  const paymentAmount = Number(amount);
  const balance = Number(lease.totalBilled) - Number(lease.amountPaid || 0);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > balance) throw ApiError.badRequest("Payment exceeds lease balance");
  const payment = await RentPayment.create({
    tenantId, leaseId: lease._id, leaseTenantId: lease.leaseTenantId, propertyId: lease.propertyId, unitId: lease.unitId,
    amount: paymentAmount, method, reference,
  });
  const newPaid = Number(lease.amountPaid || 0) + paymentAmount;
  const updated = await Lease.findOneAndUpdate(
    { _id: lease._id, tenantId, amountPaid: Number(lease.amountPaid || 0) },
    { $set: { amountPaid: newPaid, rentStatus: rentStatusFor(Number(lease.totalBilled), newPaid) } },
    { new: true },
  );
  if (!updated) { await RentPayment.deleteOne({ _id: payment._id }); throw ApiError.conflict("Lease was updated by another payment; retry"); }
  return { payment: payment.toObject(), lease: updated.toObject() };
}

async function listPayments({ tenantId, leaseId, propertyId, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (leaseId) filter.leaseId = leaseId;
  if (propertyId) filter.propertyId = propertyId;
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    RentPayment.find(filter).populate("leaseId", "leaseNo").populate("leaseTenantId", "name").populate("propertyId", "name").sort({ paidAt: -1 }).skip(skip).limit(limit).lean(),
    RentPayment.countDocuments(filter),
  ]);
  return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

// ── Expenses ────────────────────────────────────────────
async function listExpenses({ tenantId, propertyId, category, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (propertyId) filter.propertyId = propertyId;
  if (category) filter.category = category;
  const skip = (page - 1) * limit;
  const [expenses, total] = await Promise.all([
    PropertyExpense.find(filter).populate("propertyId", "name").populate("vendorId", "name").sort({ date: -1 }).skip(skip).limit(limit).lean(),
    PropertyExpense.countDocuments(filter),
  ]);
  return { expenses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createExpense({ tenantId, data }) {
  if (data.propertyId) {
    const property = await Property.exists({ _id: data.propertyId, tenantId });
    if (!property) throw ApiError.notFound("Property not found");
  }
  return (await PropertyExpense.create({ tenantId, ...data, date: data.date ? new Date(data.date) : new Date() })).toObject();
}

async function updateExpense({ tenantId, id, data }) {
  const update = { ...data };
  if (data.date !== undefined) update.date = new Date(data.date);
  const expense = await PropertyExpense.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true }).lean();
  if (!expense) throw ApiError.notFound("Expense not found");
  return expense;
}

async function deleteExpense({ tenantId, id }) {
  const expense = await PropertyExpense.findOneAndDelete({ _id: id, tenantId });
  if (!expense) throw ApiError.notFound("Expense not found");
  return { success: true };
}

// ── Maintenance ─────────────────────────────────────────
async function listMaintenance({ tenantId, status, priority, propertyId, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (propertyId) filter.propertyId = propertyId;
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    MaintenanceRequest.find(filter)
      .populate("propertyId", "name city")
      .populate("unitId", "unitNo")
      .populate("vendorId", "name serviceType")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MaintenanceRequest.countDocuments(filter),
  ]);
  return { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createMaintenance({ tenantId, data }) {
  const property = await Property.exists({ _id: data.propertyId, tenantId, isActive: true });
  if (!property) throw ApiError.notFound("Property not found");
  const request = await MaintenanceRequest.create({
    tenantId, ...data,
    history: [{ note: "Request created", by: data.createdBy || "system" }],
  });
  return request.toObject();
}

async function updateMaintenance({ tenantId, id, data, by }) {
  const existing = await MaintenanceRequest.findOne({ _id: id, tenantId });
  if (!existing) throw ApiError.notFound("Maintenance request not found");
  const changes = {};
  if (data.status !== undefined && data.status !== existing.status) changes.status = data.status;
  if (data.priority !== undefined && data.priority !== existing.priority) changes.priority = data.priority;
  if (data.assignedTo !== undefined) changes.assignedTo = data.assignedTo;
  if (data.vendorId !== undefined) changes.vendorId = data.vendorId;
  if (data.cost !== undefined) changes.cost = Number(data.cost);
  if (data.notes !== undefined) changes.notes = data.notes;
  if (data.status === "COMPLETED") changes.completedAt = new Date();
  const note = data.note || Object.entries(changes).filter(([key]) => key !== "completedAt").map(([key, value]) => `${key} set to ${value}`).join(", ");
  const update = { $set: changes };
  if (note) update.$push = { history: { note, by: by || "system" } };
  const request = await MaintenanceRequest.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true })
    .populate("propertyId", "name city").populate("unitId", "unitNo").populate("vendorId", "name serviceType")
    .lean();
  return request;
}

// ── Vendors ─────────────────────────────────────────────
async function listVendors({ tenantId, search, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (search) {
    const safe = escape(search);
    filter.$or = [{ name: { $regex: safe, $options: "i" } }, { phone: { $regex: safe, $options: "i" } }, { serviceType: { $regex: safe, $options: "i" } }];
  }
  const skip = (page - 1) * limit;
  const [vendors, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ]);
  return { vendors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createVendor({ tenantId, data }) {
  return (await Vendor.create({ tenantId, ...data })).toObject();
}

async function updateVendor({ tenantId, id, data }) {
  const vendor = await Vendor.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean();
  if (!vendor) throw ApiError.notFound("Vendor not found");
  return vendor;
}

// ── Documents ───────────────────────────────────────────
async function listDocuments({ tenantId, propertyId, docType, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (propertyId) filter.propertyId = propertyId;
  if (docType) filter.docType = docType;
  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    PropertyDocument.find(filter).populate("propertyId", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PropertyDocument.countDocuments(filter),
  ]);
  return { documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createDocument({ tenantId, data }) {
  if (data.propertyId) {
    const property = await Property.exists({ _id: data.propertyId, tenantId });
    if (!property) throw ApiError.notFound("Property not found");
  }
  return (await PropertyDocument.create({ tenantId, ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined })).toObject();
}

async function deleteDocument({ tenantId, id }) {
  const document = await PropertyDocument.findOneAndDelete({ _id: id, tenantId });
  if (!document) throw ApiError.notFound("Document not found");
  return { success: true };
}

// ── Tasks ───────────────────────────────────────────────
async function listTasks({ tenantId, status, propertyId, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (status) filter.status = status;
  if (propertyId) filter.propertyId = propertyId;
  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    PropertyTask.find(filter).populate("propertyId", "name").sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    PropertyTask.countDocuments(filter),
  ]);
  return { tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createTask({ tenantId, data }) {
  if (data.propertyId) {
    const property = await Property.exists({ _id: data.propertyId, tenantId });
    if (!property) throw ApiError.notFound("Property not found");
  }
  return (await PropertyTask.create({ tenantId, ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined })).toObject();
}

async function updateTask({ tenantId, id, data }) {
  const update = { ...data };
  if (data.dueDate !== undefined) update.dueDate = new Date(data.dueDate);
  const task = await PropertyTask.findOneAndUpdate({ _id: id, tenantId }, update, { new: true, runValidators: true }).lean();
  if (!task) throw ApiError.notFound("Task not found");
  return task;
}

// ── Dashboard & reports ──────────────────────────────────
async function dashboard({ tenantId }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const in60Days = new Date(now.getTime() + 60 * 86400000);
  const [unitStatuses, activeLeases, expiring, openMaintenance, collected, expenses, totalProperties] = await Promise.all([
    PropertyUnit.aggregate([{ $match: { tenantId: oid(tenantId), isActive: true } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lease.find({ tenantId, status: "ACTIVE" }).lean(),
    Lease.countDocuments({ tenantId, status: "ACTIVE", endDate: { $gte: now, $lte: in60Days } }),
    MaintenanceRequest.countDocuments({ tenantId, status: { $in: ["OPEN", "IN_PROGRESS"] } }),
    RentPayment.aggregate([{ $match: { tenantId: oid(tenantId), paidAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    PropertyExpense.aggregate([{ $match: { tenantId: oid(tenantId), date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Property.countDocuments({ tenantId, isActive: true }),
  ]);
  const units = Object.fromEntries(unitStatuses.map((row) => [String(row._id).toLowerCase(), row.count]));
  const totalUnits = unitStatuses.reduce((sum, row) => sum + row.count, 0);
  const expectedRent = activeLeases.reduce((sum, lease) => sum + Number(lease.rentAmount || 0), 0);
  const overdueLeases = activeLeases.filter((lease) => {
    const balance = Number(lease.totalBilled || 0) - Number(lease.amountPaid || 0);
    if (balance <= 0) return false;
    const dueAt = new Date(now.getFullYear(), now.getMonth(), Math.min(Number(lease.dueDay || 1), 28));
    return now >= dueAt;
  });
  const collectedThisMonth = collected[0]?.total || 0;
  const expensesThisMonth = expenses[0]?.total || 0;
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ start, key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[start.getMonth()] });
  }
  const [paySeries, expenseSeries] = await Promise.all([
    RentPayment.aggregate([{ $match: { tenantId: oid(tenantId), paidAt: { $gte: months[0].start } } }, { $group: { _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } }, total: { $sum: "$amount" } } }]),
    PropertyExpense.aggregate([{ $match: { tenantId: oid(tenantId), date: { $gte: months[0].start } } }, { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, total: { $sum: "$amount" } } }]),
  ]);
  const payMap = new Map(paySeries.map((row) => [`${row._id.y}-${String(row._id.m).padStart(2, "0")}`, row.total]));
  const expenseMap = new Map(expenseSeries.map((row) => [`${row._id.y}-${String(row._id.m).padStart(2, "0")}`, row.total]));
  const monthly = months.map((month) => {
    const collectedAmount = payMap.get(month.key) || 0;
    const expenseAmount = expenseMap.get(month.key) || 0;
    return { month: month.label, collected: collectedAmount, expenses: expenseAmount, net: collectedAmount - expenseAmount };
  });
  return {
    totalProperties, totalUnits, occupiedUnits: units.occupied || 0, vacantUnits: units.vacant || 0, maintenanceUnits: units.maintenance || 0,
    occupancyRate: totalUnits ? Math.round(((units.occupied || 0) / totalUnits) * 100) : 0,
    expectedRent, collectedThisMonth, expensesThisMonth, netIncome: collectedThisMonth - expensesThisMonth,
    overdueRent: overdueLeases.reduce((sum, lease) => sum + Math.max(0, Number(lease.totalBilled || 0) - Number(lease.amountPaid || 0)), 0),
    overdueCount: overdueLeases.length, upcomingExpirations: expiring, openMaintenance,
    monthly,
  };
}

module.exports = {
  listProperties, createProperty, updateProperty, archiveProperty,
  listUnits, createUnit, updateUnit, archiveUnit,
  listTenants, createTenant, updateTenant,
  listLeases, createLease, getLease, updateLease, terminateLease,
  recordPayment, listPayments,
  listExpenses, createExpense, updateExpense, deleteExpense,
  listMaintenance, createMaintenance, updateMaintenance,
  listVendors, createVendor, updateVendor,
  listDocuments, createDocument, deleteDocument,
  listTasks, createTask, updateTask,
  dashboard,
};
