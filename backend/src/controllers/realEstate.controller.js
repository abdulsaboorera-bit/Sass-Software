"use strict";

const { z } = require("zod");
const service = require("../services/realEstate/realEstate.service");
const { apiSuccess, ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { paginate } = require("../utils/query");

const propertySchema = z.object({
  name: z.string().min(2), address: z.string().optional(), city: z.string().optional(),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"]).optional(), description: z.string().optional(),
  pictures: z.array(z.string().url()).max(20).optional(), notes: z.string().optional(),
});
const unitSchema = z.object({
  propertyId: z.string().min(1), unitNo: z.string().min(1), floor: z.number().int().optional(),
  type: z.enum(["APARTMENT", "SHOP", "OFFICE", "HOUSE", "ROOM", "OTHER"]).optional(),
  bedrooms: z.number().int().nonnegative().optional(), bathrooms: z.number().int().nonnegative().optional(),
  areaSqft: z.number().nonnegative().optional(), rentAmount: z.number().nonnegative(),
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE", "NOT_AVAILABLE"]).optional(), notes: z.string().optional(),
});
const tenantSchema = z.object({ name: z.string().min(2), phone: z.string().min(4), email: z.string().email().optional(), nationalId: z.string().optional(), address: z.string().optional(), emergencyContact: z.string().optional(), notes: z.string().optional() });
const leaseSchema = z.object({
  unitId: z.string().min(1), leaseTenantId: z.string().min(1), startDate: z.string(), endDate: z.string(),
  rentAmount: z.number().nonnegative().optional(), depositAmount: z.number().nonnegative().optional(), depositPaid: z.number().nonnegative().optional(),
  dueDay: z.number().int().min(1).max(31).optional(), paymentAmount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(), reference: z.string().optional(), notes: z.string().optional(),
});
const leaseUpdateSchema = z.object({ dueDay: z.number().int().min(1).max(31).optional(), depositPaid: z.number().nonnegative().optional(), notes: z.string().optional() });
const paymentSchema = z.object({ leaseId: z.string().min(1), amount: z.number().positive(), method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]), reference: z.string().optional() });
const expenseSchema = z.object({
  propertyId: z.string().optional(), unitId: z.string().optional(), vendorId: z.string().optional(),
  category: z.enum(["REPAIRS", "UTILITIES", "MAINTENANCE", "TAXES", "INSURANCE", "MARKETING", "SALARIES", "OTHER"]).optional(),
  amount: z.number().nonnegative(), date: z.string().optional(), description: z.string().optional(), notes: z.string().optional(),
});
const maintenanceSchema = z.object({
  propertyId: z.string().min(1), unitId: z.string().optional(), title: z.string().min(2), description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(), vendorId: z.string().optional(), assignedTo: z.string().optional(), notes: z.string().optional(),
});
const maintenanceUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().optional(), vendorId: z.string().optional(), cost: z.number().nonnegative().optional(), notes: z.string().optional(), note: z.string().optional(),
});
const vendorSchema = z.object({ name: z.string().min(2), phone: z.string().min(4), serviceType: z.enum(["PLUMBING", "ELECTRICAL", "CLEANING", "HVAC", "SECURITY", "GENERAL", "OTHER"]).optional(), email: z.string().email().optional(), notes: z.string().optional() });
const documentSchema = z.object({
  title: z.string().min(2), url: z.string().url(), propertyId: z.string().optional(), unitId: z.string().optional(),
  docType: z.enum(["DEED", "LEASE_AGREEMENT", "IDENTITY", "RECEIPT", "INVOICE", "OTHER"]).optional(), expiresAt: z.string().optional(), notes: z.string().optional(),
});
const taskSchema = z.object({
  title: z.string().min(2), description: z.string().optional(), dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), propertyId: z.string().optional(), assignedTo: z.string().optional(), notes: z.string().optional(),
});
const taskUpdateSchema = taskSchema.partial().extend({ status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional() });

const listProperties = asyncHandler(async (req, res) => apiSuccess(res, await service.listProperties({ tenantId: req.tenantId, search: req.query.search, type: req.query.type, ...paginate(req.query) })));
const createProperty = asyncHandler(async (req, res) => apiSuccess(res, { property: await service.createProperty({ tenantId: req.tenantId, data: propertySchema.parse(req.body) }) }, 201));
const updateProperty = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { property: await service.updateProperty({ tenantId: req.tenantId, id, data: propertySchema.partial().parse(req.body) }) }); });
const archiveProperty = asyncHandler(async (req, res) => apiSuccess(res, await service.archiveProperty({ tenantId: req.tenantId, id: req.params.id || req.query.id })));

const listUnits = asyncHandler(async (req, res) => apiSuccess(res, await service.listUnits({ tenantId: req.tenantId, propertyId: req.query.propertyId, status: req.query.status, search: req.query.search, ...paginate(req.query) })));
const createUnit = asyncHandler(async (req, res) => apiSuccess(res, { unit: await service.createUnit({ tenantId: req.tenantId, data: unitSchema.parse(req.body) }) }, 201));
const updateUnit = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { unit: await service.updateUnit({ tenantId: req.tenantId, id, data: unitSchema.partial().omit({ propertyId: true }).parse(req.body) }) }); });
const archiveUnit = asyncHandler(async (req, res) => apiSuccess(res, await service.archiveUnit({ tenantId: req.tenantId, id: req.params.id || req.query.id })));

const listTenants = asyncHandler(async (req, res) => apiSuccess(res, await service.listTenants({ tenantId: req.tenantId, search: req.query.search, ...paginate(req.query) })));
const createTenant = asyncHandler(async (req, res) => apiSuccess(res, { tenant: await service.createTenant({ tenantId: req.tenantId, data: tenantSchema.parse(req.body) }) }, 201));
const updateTenant = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { tenant: await service.updateTenant({ tenantId: req.tenantId, id, data: tenantSchema.partial().parse(req.body) }) }); });

const listLeases = asyncHandler(async (req, res) => apiSuccess(res, await service.listLeases({ tenantId: req.tenantId, status: req.query.status, propertyId: req.query.propertyId, ...paginate(req.query) })));
const createLease = asyncHandler(async (req, res) => apiSuccess(res, { lease: await service.createLease({ tenantId: req.tenantId, data: leaseSchema.parse(req.body) }) }, 201));
const getLease = asyncHandler(async (req, res) => apiSuccess(res, { lease: await service.getLease({ tenantId: req.tenantId, id: req.params.id }) }));
const updateLease = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { lease: await service.updateLease({ tenantId: req.tenantId, id, data: leaseUpdateSchema.parse(req.body) }) }); });
const terminateLease = asyncHandler(async (req, res) => apiSuccess(res, { lease: await service.terminateLease({ tenantId: req.tenantId, id: req.params.id }) }));

const listPayments = asyncHandler(async (req, res) => apiSuccess(res, await service.listPayments({ tenantId: req.tenantId, leaseId: req.query.leaseId, propertyId: req.query.propertyId, ...paginate(req.query) })));
const recordPayment = asyncHandler(async (req, res) => { const data = paymentSchema.parse(req.body); return apiSuccess(res, await service.recordPayment({ tenantId: req.tenantId, ...data }), 201); });

const listExpenses = asyncHandler(async (req, res) => apiSuccess(res, await service.listExpenses({ tenantId: req.tenantId, propertyId: req.query.propertyId, category: req.query.category, ...paginate(req.query) })));
const createExpense = asyncHandler(async (req, res) => apiSuccess(res, { expense: await service.createExpense({ tenantId: req.tenantId, data: expenseSchema.parse(req.body) }) }, 201));
const updateExpense = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { expense: await service.updateExpense({ tenantId: req.tenantId, id, data: expenseSchema.partial().parse(req.body) }) }); });
const deleteExpense = asyncHandler(async (req, res) => apiSuccess(res, await service.deleteExpense({ tenantId: req.tenantId, id: req.params.id || req.query.id })));

const listMaintenance = asyncHandler(async (req, res) => apiSuccess(res, await service.listMaintenance({ tenantId: req.tenantId, status: req.query.status, priority: req.query.priority, propertyId: req.query.propertyId, ...paginate(req.query) })));
const createMaintenance = asyncHandler(async (req, res) => apiSuccess(res, { request: await service.createMaintenance({ tenantId: req.tenantId, data: maintenanceSchema.parse(req.body) }) }, 201));
const updateMaintenance = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { request: await service.updateMaintenance({ tenantId: req.tenantId, id, data: maintenanceUpdateSchema.parse(req.body), by: req.user?.name }) }); });

const listVendors = asyncHandler(async (req, res) => apiSuccess(res, await service.listVendors({ tenantId: req.tenantId, search: req.query.search, ...paginate(req.query) })));
const createVendor = asyncHandler(async (req, res) => apiSuccess(res, { vendor: await service.createVendor({ tenantId: req.tenantId, data: vendorSchema.parse(req.body) }) }, 201));
const updateVendor = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { vendor: await service.updateVendor({ tenantId: req.tenantId, id, data: vendorSchema.partial().parse(req.body) }) }); });

const listDocuments = asyncHandler(async (req, res) => apiSuccess(res, await service.listDocuments({ tenantId: req.tenantId, propertyId: req.query.propertyId, docType: req.query.docType, ...paginate(req.query) })));
const createDocument = asyncHandler(async (req, res) => apiSuccess(res, { document: await service.createDocument({ tenantId: req.tenantId, data: documentSchema.parse(req.body) }) }, 201));
const deleteDocument = asyncHandler(async (req, res) => apiSuccess(res, await service.deleteDocument({ tenantId: req.tenantId, id: req.params.id || req.query.id })));

const listTasks = asyncHandler(async (req, res) => apiSuccess(res, await service.listTasks({ tenantId: req.tenantId, status: req.query.status, propertyId: req.query.propertyId, ...paginate(req.query) })));
const createTask = asyncHandler(async (req, res) => apiSuccess(res, { task: await service.createTask({ tenantId: req.tenantId, data: taskSchema.parse(req.body) }) }, 201));
const updateTask = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { task: await service.updateTask({ tenantId: req.tenantId, id, data: taskUpdateSchema.parse(req.body) }) }); });

const dashboard = asyncHandler(async (req, res) => apiSuccess(res, await service.dashboard({ tenantId: req.tenantId })));

module.exports = {
  listProperties, createProperty, updateProperty, archiveProperty,
  listUnits, createUnit, updateUnit, archiveUnit,
  listTenants, createTenant, updateTenant,
  listLeases, createLease, getLease, updateLease, terminateLease,
  listPayments, recordPayment,
  listExpenses, createExpense, updateExpense, deleteExpense,
  listMaintenance, createMaintenance, updateMaintenance,
  listVendors, createVendor, updateVendor,
  listDocuments, createDocument, deleteDocument,
  listTasks, createTask, updateTask,
  dashboard,
};
