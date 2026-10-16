"use strict";

const models = require("../models");
const { LoyaltyTransaction } = models;
const { ApiError } = require("../utils/apiResponse");

/** Which industry collection a loyalty `customerType` maps to. */
const CUSTOMER_MODELS = {
  GYM: "Member",
  RESTAURANT: "RestaurantCustomer",
  BOOKSHOP: "BookCustomer",
  SALON: "SalonCustomer",
  CAR_RENTAL: "RentalCustomer",
};

function resolveCustomerModel(customerType) {
  const name = CUSTOMER_MODELS[customerType];
  if (!name || !models[name]) throw ApiError.badRequest(`Unsupported customer type: ${customerType}`);
  return models[name];
}

/**
 * Award/redeem points for a customer and append a ledger row. Keeps the running
 * balance on the customer document (`loyaltyPoints`) in sync when that field
 * exists, and always records the movement in `LoyaltyTransaction`.
 */
async function adjustPoints({ tenantId, customerType, customerId, points, type, reason, orderRef }) {
  const Model = resolveCustomerModel(customerType);
  const delta = Number(points);
  if (!Number.isFinite(delta) || delta === 0) throw ApiError.badRequest("points must be a non-zero number");

  const customer = await Model.findOne({ _id: customerId, tenantId }).lean();
  if (!customer) throw ApiError.notFound("Customer not found");

  const current = Number(customer.loyaltyPoints) || 0;
  const balanceAfter = current + delta;
  if (balanceAfter < 0) throw ApiError.badRequest("Insufficient loyalty points");

  await Model.updateOne({ _id: customerId, tenantId }, { $set: { loyaltyPoints: balanceAfter } });

  const txType = type || (delta > 0 ? "EARNED" : "REDEEMED");
  const tx = await LoyaltyTransaction.create({
    tenantId,
    customerType,
    customerId,
    customerName: customer.name,
    points: delta,
    balanceAfter,
    type: txType,
    reason,
    orderRef,
  });
  return { transaction: tx, balance: balanceAfter };
}

module.exports = { adjustPoints, CUSTOMER_MODELS };
