"use strict";

const mongoose = require("mongoose");
const { Car, RentalCustomer, Rental, RentalPayment } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { invoiceRef } = require("../../utils/ids");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function listCars({ tenantId, status, search, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (status) filter.status = status;
  if (search) filter.$or = [
    { registrationNo: { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    { make: { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    { model: { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
  ];
  const skip = (page - 1) * limit;
  const [cars, total] = await Promise.all([
    Car.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Car.countDocuments(filter),
  ]);
  return { cars, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createCar({ tenantId, data }) {
  const car = await Car.create({ tenantId, ...data, registrationNo: data.registrationNo.toUpperCase() });
  return car.toObject();
}

async function updateCar({ tenantId, id, data }) {
  const car = await Car.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!car) throw ApiError.notFound("Car not found");
  return car;
}

async function archiveCar({ tenantId, id }) {
  const activeRental = await Rental.exists({ tenantId, carId: id, status: { $in: ["RESERVED", "ACTIVE", "OVERDUE"] } });
  if (activeRental) throw ApiError.badRequest("A car with an active rental cannot be archived");
  const car = await Car.findOneAndUpdate({ _id: id, tenantId }, { isActive: false, status: "NOT_AVAILABLE" }, { new: true });
  if (!car) throw ApiError.notFound("Car not found");
  return { success: true };
}

async function listCustomers({ tenantId, search, page = 1, limit = 25 }) {
  const filter = { tenantId, isActive: true };
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: { $regex: safe, $options: "i" } }, { phone: { $regex: safe, $options: "i" } }, { licenseNumber: { $regex: safe, $options: "i" } }];
  }
  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    RentalCustomer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RentalCustomer.countDocuments(filter),
  ]);
  return { customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createCustomer({ tenantId, data }) {
  return (await RentalCustomer.create({ tenantId, ...data })).toObject();
}

async function updateCustomer({ tenantId, id, data }) {
  const customer = await RentalCustomer.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean();
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

async function listRentals({ tenantId, status, page = 1, limit = 25 }) {
  const filter = { tenantId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [rentals, total] = await Promise.all([
    Rental.find(filter).populate("carId", "registrationNo make model status").populate("customerId", "name phone licenseNumber").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Rental.countDocuments(filter),
  ]);
  return { rentals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function createRental({ tenantId, data }) {
  const [car, customer] = await Promise.all([
    Car.findOne({ _id: data.carId, tenantId, isActive: true }),
    RentalCustomer.findOne({ _id: data.customerId, tenantId, isActive: true }),
  ]);
  if (!car) throw ApiError.notFound("Available car not found");
  if (!customer) throw ApiError.notFound("Customer not found");
  if (car.status !== "AVAILABLE") throw ApiError.badRequest("Car is not available");
  const pickupAt = new Date(data.pickupAt);
  const dueAt = new Date(data.dueAt);
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(dueAt.getTime()) || dueAt <= pickupAt) throw ApiError.badRequest("Rental dates are invalid");
  if (customer.licenseExpiry && new Date(customer.licenseExpiry) < pickupAt) throw ApiError.badRequest("Customer driving license is expired");
  const days = Math.max(1, Math.ceil((dueAt - pickupAt) / 86400000));
  const ratePerDay = Number(data.ratePerDay ?? car.dailyRate);
  const subtotal = ratePerDay * days;
  const discount = Number(data.discount || 0);
  const tax = Number(data.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);
  if (discount > subtotal) throw ApiError.badRequest("Discount cannot exceed subtotal");
  const rental = await Rental.create({ tenantId, rentalNo: invoiceRef("REN"), carId: car._id, customerId: customer._id, pickupAt, dueAt, ratePerDay, days, subtotal, discount, tax, total, depositRequired: data.depositRequired ?? car.depositAmount, depositPaid: data.depositPaid || 0, amountPaid: 0, status: "ACTIVE", pickupMileage: data.pickupMileage, notes: data.notes });
  try {
    await Car.updateOne({ _id: car._id, tenantId, status: "AVAILABLE" }, { $set: { status: "RENTED" } });
    if (Number(data.paymentAmount || 0) > 0) await recordPayment({ tenantId, rentalId: rental._id, amount: data.paymentAmount, method: data.paymentMethod || "CASH", reference: data.reference });
  } catch (error) {
    await Rental.deleteOne({ _id: rental._id, tenantId });
    throw error;
  }
  return getRental({ tenantId, id: rental._id });
}

async function getRental({ tenantId, id }) {
  const rental = await Rental.findOne({ _id: id, tenantId }).populate("carId").populate("customerId").lean({ virtuals: true });
  if (!rental) throw ApiError.notFound("Rental not found");
  const payments = await RentalPayment.find({ tenantId, rentalId: id }).sort({ paidAt: -1 }).lean();
  return { ...rental, payments };
}

async function recordPayment({ tenantId, rentalId, amount, method, reference }) {
  const rental = await Rental.findOne({ _id: rentalId, tenantId });
  if (!rental) throw ApiError.notFound("Rental not found");
  if (["CANCELLED"].includes(rental.status)) throw ApiError.badRequest("Cannot pay a cancelled rental");
  const paymentAmount = Number(amount);
  const balance = Number(rental.total) - Number(rental.amountPaid || 0);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > balance) throw ApiError.badRequest("Payment exceeds rental balance");
  const payment = await RentalPayment.create({ tenantId, rentalId: rental._id, customerId: rental.customerId, amount: paymentAmount, method, reference });
  const updated = await Rental.findOneAndUpdate({ _id: rental._id, tenantId, amountPaid: Number(rental.amountPaid || 0) }, { $inc: { amountPaid: paymentAmount } }, { new: true });
  if (!updated) { await RentalPayment.deleteOne({ _id: payment._id }); throw ApiError.conflict("Rental was updated by another payment; retry"); }
  return { payment: payment.toObject(), rental: updated.toObject() };
}

async function returnRental({ tenantId, id, returnMileage, notes }) {
  const rental = await Rental.findOneAndUpdate({ _id: id, tenantId, status: { $in: ["ACTIVE", "OVERDUE"] } }, { $set: { status: "COMPLETED", returnedAt: new Date(), returnMileage, notes } }, { new: true });
  if (!rental) throw ApiError.notFound("Active rental not found");
  await Car.updateOne({ _id: rental.carId, tenantId }, { $set: { status: "AVAILABLE", ...(returnMileage !== undefined ? { mileage: returnMileage } : {}) } });
  return getRental({ tenantId, id });
}

async function cancelRental({ tenantId, id }) {
  const rental = await Rental.findOneAndUpdate({ _id: id, tenantId, status: { $in: ["RESERVED", "ACTIVE"] } }, { $set: { status: "CANCELLED" } }, { new: true });
  if (!rental) throw ApiError.notFound("Cancellable rental not found");
  await Car.updateOne({ _id: rental.carId, tenantId }, { $set: { status: "AVAILABLE" } });
  return rental.toObject();
}

async function dashboard({ tenantId }) {
  const [cars, activeRentals, overdue, revenue] = await Promise.all([
    Car.aggregate([{ $match: { tenantId: oid(tenantId), isActive: true } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Rental.countDocuments({ tenantId, status: { $in: ["ACTIVE", "RESERVED"] } }),
    Rental.countDocuments({ tenantId, status: "OVERDUE" }),
    RentalPayment.aggregate([{ $match: { tenantId: oid(tenantId) } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);
  return { cars: Object.fromEntries(cars.map((row) => [row._id.toLowerCase(), row.count])), activeRentals, overdueRentals: overdue, totalCollected: revenue[0]?.total || 0 };
}

module.exports = { listCars, createCar, updateCar, archiveCar, listCustomers, createCustomer, updateCustomer, listRentals, createRental, getRental, recordPayment, returnRental, cancelRental, dashboard };
