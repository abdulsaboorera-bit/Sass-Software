"use strict";

const { z } = require("zod");
const service = require("../services/carRental/rental.service");
const { apiSuccess, ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { paginate } = require("../utils/query");

const carSchema = z.object({
  registrationNo: z.string().min(2), make: z.string().min(1), model: z.string().min(1), year: z.number().int().min(1900).max(2200),
  color: z.string().optional(), category: z.enum(["ECONOMY", "COMPACT", "SEDAN", "SUV", "LUXURY", "VAN", "OTHER"]).optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "OTHER"]).optional(), fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"]).optional(),
  seats: z.number().int().positive().optional(), dailyRate: z.number().nonnegative(), weeklyRate: z.number().nonnegative().optional(), depositAmount: z.number().nonnegative().optional(), mileage: z.number().nonnegative().optional(), pictures: z.array(z.string().url()).max(20).optional(), status: z.enum(["AVAILABLE", "RENTED", "NOT_AVAILABLE", "WORKSHOP"]).optional(), notes: z.string().optional(),
});
const customerSchema = z.object({ name: z.string().min(2), phone: z.string().min(4), email: z.string().email().optional(), licenseNumber: z.string().min(3), licenseExpiry: z.string().optional(), nationalId: z.string().optional(), address: z.string().optional(), emergencyContact: z.string().optional(), notes: z.string().optional() });
const rentalSchema = z.object({ carId: z.string().min(1), customerId: z.string().min(1), pickupAt: z.string(), dueAt: z.string(), ratePerDay: z.number().nonnegative().optional(), discount: z.number().nonnegative().optional(), tax: z.number().nonnegative().optional(), depositRequired: z.number().nonnegative().optional(), depositPaid: z.number().nonnegative().optional(), pickupMileage: z.number().nonnegative().optional(), paymentAmount: z.number().nonnegative().optional(), paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(), reference: z.string().optional(), notes: z.string().optional() });

const listCars = asyncHandler(async (req, res) => apiSuccess(res, await service.listCars({ tenantId: req.tenantId, status: req.query.status, search: req.query.search, ...paginate(req.query) })));
const createCar = asyncHandler(async (req, res) => apiSuccess(res, { car: await service.createCar({ tenantId: req.tenantId, data: carSchema.parse(req.body) }) }, 201));
const updateCar = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { car: await service.updateCar({ tenantId: req.tenantId, id, data: carSchema.partial().parse(req.body) }) }); });
const archiveCar = asyncHandler(async (req, res) => apiSuccess(res, await service.archiveCar({ tenantId: req.tenantId, id: req.params.id || req.query.id })));

const listCustomers = asyncHandler(async (req, res) => apiSuccess(res, await service.listCustomers({ tenantId: req.tenantId, search: req.query.search, ...paginate(req.query) })));
const createCustomer = asyncHandler(async (req, res) => apiSuccess(res, { customer: await service.createCustomer({ tenantId: req.tenantId, data: customerSchema.parse(req.body) }) }, 201));
const updateCustomer = asyncHandler(async (req, res) => { const id = req.params.id || req.body.id; if (!id) throw ApiError.badRequest("id is required"); return apiSuccess(res, { customer: await service.updateCustomer({ tenantId: req.tenantId, id, data: customerSchema.partial().parse(req.body) }) }); });

const listRentals = asyncHandler(async (req, res) => apiSuccess(res, await service.listRentals({ tenantId: req.tenantId, status: req.query.status, ...paginate(req.query) })));
const createRental = asyncHandler(async (req, res) => apiSuccess(res, { rental: await service.createRental({ tenantId: req.tenantId, data: rentalSchema.parse(req.body) }) }, 201));
const getRental = asyncHandler(async (req, res) => apiSuccess(res, { rental: await service.getRental({ tenantId: req.tenantId, id: req.params.id }) }));
const returnRental = asyncHandler(async (req, res) => apiSuccess(res, { rental: await service.returnRental({ tenantId: req.tenantId, id: req.params.id, ...z.object({ returnMileage: z.number().nonnegative().optional(), notes: z.string().optional() }).parse(req.body || {}) }) }));
const cancelRental = asyncHandler(async (req, res) => apiSuccess(res, { rental: await service.cancelRental({ tenantId: req.tenantId, id: req.params.id }) }));
const recordPayment = asyncHandler(async (req, res) => { const data = z.object({ rentalId: z.string().min(1), amount: z.number().positive(), method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]), reference: z.string().optional() }).parse(req.body); return apiSuccess(res, await service.recordPayment({ tenantId: req.tenantId, ...data }), 201); });
const dashboard = asyncHandler(async (req, res) => apiSuccess(res, await service.dashboard({ tenantId: req.tenantId })));

module.exports = { listCars, createCar, updateCar, archiveCar, listCustomers, createCustomer, updateCustomer, listRentals, createRental, getRental, returnRental, cancelRental, recordPayment, dashboard };
