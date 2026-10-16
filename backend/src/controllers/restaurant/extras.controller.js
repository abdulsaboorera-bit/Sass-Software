"use strict";

const { Order, OrderItem, RestaurantPayment } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/** Resolve a [start, end) date window from `date` (YYYY-MM-DD) or `from`/`to`. */
function resolveWindow(query) {
  if (query.date) {
    const start = new Date(String(query.date));
    if (Number.isNaN(start.getTime())) throw ApiError.badRequest("Invalid date");
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (query.from || query.to) {
    const start = query.from ? new Date(String(query.from)) : new Date(0);
    const end = query.to ? new Date(String(query.to)) : new Date();
    if (query.to) end.setDate(end.getDate() + 1);
    return { start, end };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** GET /api/restaurant/kitchen/orders — live board of open/preparing tickets. */
const kitchenBoard = asyncHandler(async (req, res) => {
  const statuses = ["OPEN", "PREPARING", "SERVED"];
  const orders = await Order.find({ tenantId: req.tenantId, status: { $in: statuses } })
    .populate("table", "number")
    .populate({ path: "orderItems", populate: { path: "menuItem", select: "name preparationTime" } })
    .sort({ createdAt: 1 })
    .lean({ virtuals: true });

  const board = { OPEN: [], PREPARING: [], SERVED: [] };
  for (const order of orders) {
    if (board[order.status]) board[order.status].push(order);
  }
  return apiSuccess(res, { board, generatedAt: new Date() });
});

/** GET /api/restaurant/reports/z-report?date=YYYY-MM-DD — end-of-day sales summary. */
const zReport = asyncHandler(async (req, res) => {
  const { start, end } = resolveWindow(req.query);
  const filter = { tenantId: req.tenantId, status: { $ne: "CANCELLED" }, createdAt: { $gte: start, $lt: end } };

  const orders = await Order.find(filter).lean({ virtuals: true });
  const orderIds = orders.map((o) => o._id);

  const payments = await RestaurantPayment.find({ tenantId: req.tenantId, paidAt: { $gte: start, $lt: end } }).lean();

  const byMethod = {};
  let collected = 0;
  for (const p of payments) {
    const method = p.method || "CASH";
    byMethod[method] = (byMethod[method] || 0) + Number(p.amount || 0);
    collected += Number(p.amount || 0);
  }

  const totals = orders.reduce(
    (acc, o) => {
      acc.gross += Number(o.total || 0);
      acc.subtotal += Number(o.subtotal || 0);
      acc.tax += Number(o.tax || 0);
      acc.discount += Number(o.discount || 0);
      acc.serviceCharge += Number(o.serviceCharge || 0);
      acc.deliveryFee += Number(o.deliveryFee || 0);
      return acc;
    },
    { gross: 0, subtotal: 0, tax: 0, discount: 0, serviceCharge: 0, deliveryFee: 0 }
  );

  const itemAgg = orderIds.length
    ? await OrderItem.aggregate([
        { $match: { tenantId: req.tenantId, orderId: { $in: orderIds } } },
        { $group: { _id: "$menuItemName", quantity: { $sum: "$quantity" }, revenue: { $sum: "$total" } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ])
    : [];

  return apiSuccess(res, {
    period: { from: start, to: end },
    orders: {
      count: orders.length,
      paid: orders.filter((o) => o.paymentStatus === "PAID").length,
      unpaid: orders.filter((o) => o.paymentStatus !== "PAID").length,
    },
    sales: totals,
    collected,
    outstanding: Math.max(0, totals.gross - collected),
    byMethod,
    topItems: itemAgg.map((i) => ({ name: i._id || "Unknown", quantity: i.quantity, revenue: i.revenue })),
  });
});

module.exports = { kitchenBoard, zReport };
