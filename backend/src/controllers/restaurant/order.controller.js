"use strict";

const { z } = require("zod");
const { Order, OrderItem, MenuItem } = require("../../models");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const createSchema = z.object({
  tableId: z.string().optional(),
  staffId: z.string().optional(),
  type: z.string().optional(),
  tax: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  items: z
    .array(z.object({ menuItemId: z.string(), quantity: z.number().int().positive(), notes: z.string().optional() }))
    .min(1),
});

/** Next per-tenant order number. */
async function nextOrderNumber(tenantId) {
  const last = await Order.findOne({ tenantId }).sort({ orderNumber: -1 }).select("orderNumber").lean();
  return (last && last.orderNumber ? last.orderNumber : 0) + 1;
}

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const tenantId = req.tenantId;

  const menuIds = data.items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuIds }, tenantId }).lean();
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));
  if (byId.size !== new Set(menuIds).size) throw ApiError.badRequest("One or more menu items are invalid");

  let subtotal = 0;
  const lineItems = data.items.map((i) => {
    const mi = byId.get(i.menuItemId);
    const unitPrice = Number(mi.price);
    const total = unitPrice * i.quantity;
    subtotal += total;
    return { tenantId, menuItemId: mi._id, quantity: i.quantity, unitPrice, total, notes: i.notes };
  });

  const tax = Number(data.tax || 0);
  const discount = Number(data.discount || 0);
  const total = subtotal + tax - discount;

  const order = await Order.create({
    tenantId,
    orderNumber: await nextOrderNumber(tenantId),
    tableId: data.tableId || null,
    staffId: data.staffId || null,
    type: data.type || "DINE_IN",
    status: "OPEN",
    subtotal,
    tax,
    discount,
    total,
  });

  const created = await OrderItem.insertMany(lineItems.map((li) => ({ ...li, orderId: order._id })));
  return apiSuccess(res, { order: order.toObject(), items: created }, 201);
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const filter = { tenantId: req.tenantId };
  if (req.query.status) filter.status = req.query.status;
  const [rows, total] = await Promise.all([
    Order.find(filter)
      .populate("table", "number")
      .populate({ path: "orderItems", populate: { path: "menuItem", select: "name price" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);
  return apiSuccess(res, { orders: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate("table", "number")
    .populate({ path: "orderItems", populate: { path: "menuItem", select: "name price" } })
    .lean({ virtuals: true });
  if (!order) throw ApiError.notFound("Order not found");
  return apiSuccess(res, { order });
});

// PATCH (collection style, id in body)
const update = asyncHandler(async (req, res) => {
  const id = req.body.id || req.params.id;
  if (!id) throw ApiError.badRequest("id is required");
  const allowed = {};
  for (const f of ["status", "paymentMethod", "discount", "tax"]) if (req.body[f] !== undefined) allowed[f] = req.body[f];
  if (allowed.status === "PAID" || req.body.paidAt) allowed.paidAt = new Date();
  const order = await Order.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, allowed, { new: true }).lean();
  if (!order) throw ApiError.notFound("Order not found");
  return apiSuccess(res, { order });
});

// DELETE ?id=
const remove = asyncHandler(async (req, res) => {
  const id = req.query.id || req.params.id;
  const order = await Order.findOneAndDelete({ _id: id, tenantId: req.tenantId });
  if (!order) throw ApiError.notFound("Order not found");
  await OrderItem.deleteMany({ orderId: id, tenantId: req.tenantId });
  return apiSuccess(res, { success: true });
});

module.exports = { create, list, getOne, update, remove };
