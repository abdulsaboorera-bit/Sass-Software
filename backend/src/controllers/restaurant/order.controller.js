"use strict";

const { z } = require("zod");
const orderService = require("../../services/restaurant/order.service");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");
const { Order, OrderItem } = require("../../models");

const createSchema = z.object({
  tableId: z.string().optional(),
  customerId: z.string().optional(),
  staffId: z.string().optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).optional(),
  tax: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  serviceCharge: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().positive(),
        modifiers: z.array(z.object({ name: z.string(), price: z.number().nonnegative() })).optional(),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

const checkoutSchema = z.object({
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]),
  amount: z.number().positive().optional(),
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 50 });
  const filter = { tenantId: req.tenantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.tableId) filter.tableId = req.query.tableId;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("table", "number")
      .populate("customer", "name phone customerNo")
      .populate({ path: "orderItems", populate: { path: "menuItem", select: "name price" } })
      .sort(req.query.status === "OPEN" ? { createdAt: 1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);
  return apiSuccess(res, { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getById({ tenantId: req.tenantId, id: req.params.id });
  return apiSuccess(res, { order });
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const result = await orderService.create({ tenantId: req.tenantId, data });
  return apiSuccess(res, result, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.body.id || req.params.id;
  if (!id) throw ApiError.badRequest("id is required");
  // Status-only updates use the safe status endpoint, everything else is a
  // generic edit (notes, discounts, payment method).
  if (req.body.status) {
    const order = await orderService.setStatus({ tenantId: req.tenantId, id, status: req.body.status, cancelledReason: req.body.cancelledReason });
    return apiSuccess(res, { order });
  }
  const order = await orderService.update({ tenantId: req.tenantId, id, data: req.body });
  return apiSuccess(res, { order });
});

/** POST /orders/:id/checkout { method, amount? } */
const checkout = asyncHandler(async (req, res) => {
  const data = checkoutSchema.parse(req.body);
  const result = await orderService.checkout({ tenantId: req.tenantId, id: req.params.id, data });
  return apiSuccess(res, result);
});

const remove = asyncHandler(async (req, res) => {
  const id = req.query.id || req.params.id;
  const orders = await orderService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, orders);
});

// Delete a line item from an open order (adjusts totals).
const deleteItem = asyncHandler(async (req, res) => {
  const orderItem = await OrderItem.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!orderItem) throw ApiError.notFound("Order item not found");
  const order = await Order.findOne({ _id: orderItem.orderId, tenantId: req.tenantId });
  if (!order || order.status === "CANCELLED" || order.paymentStatus === "PAID") throw ApiError.badRequest("Cannot remove items from a cancelled or paid order");
  await orderItem.deleteOne();
  const updated = await orderService.recalcOrderTotals({ tenantId: req.tenantId, id: String(order._id) });
  return apiSuccess(res, { order: updated });
});

module.exports = { list, getOne, create, update, checkout, remove, deleteItem };