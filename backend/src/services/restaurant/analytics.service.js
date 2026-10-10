"use strict";

const mongoose = require("mongoose");
const {
  RestaurantCustomer,
  RestaurantStaff,
  RestaurantTable,
  MenuItem,
  Order,
  OrderItem,
  Reservation,
  RestaurantPayment,
  RestaurantInvoice,
  RestaurantExpense,
  RestaurantInventoryItem,
  RestaurantSalary,
  RestaurantSettings,
} = require("../../models");
const { monthRange, startOfDay, endOfDay, dayKeyInTimezone } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function customerStats({ tenantId }) {
  const { start, end } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const [total, newThisMonth, regulars] = await Promise.all([
    RestaurantCustomer.countDocuments({ tenantId, isActive: true }),
    RestaurantCustomer.countDocuments({ tenantId, createdAt: { $gte: start, $lte: end } }),
    RestaurantCustomer.countDocuments({ tenantId, visits: { $gte: 5 } }),
  ]);
  return { total, newThisMonth, regulars };
}

async function orderStats({ tenantId, timezone }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [openOrders, busyTables, todayRow, monthRow, typeRows, statusRows, avgRow] = await Promise.all([
    Order.countDocuments({ tenantId, status: { $in: ["OPEN", "PREPARING", "SERVED"] } }),
    RestaurantTable.countDocuments({ tenantId, status: { $in: ["OCCUPIED", "RESERVED"] } }),
    RestaurantPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    RestaurantPayment.aggregate([
      { $match: { tenantId: oid(tenantId), paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { tenantId: oid(tenantId), status: { $in: ["COMPLETED"] }, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { tenantId: oid(tenantId), createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { tenantId: oid(tenantId), status: "COMPLETED", createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, avg: { $avg: "$total" }, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
  ]);
  const tz = timezone || "Asia/Karachi";
  return {
    openOrders,
    busyTables,
    today: { revenue: todayRow[0]?.revenue || 0, count: todayRow[0]?.count || 0, dayKey: dayKeyInTimezone(now, tz) },
    month: { revenue: monthRow[0]?.revenue || 0, count: monthRow[0]?.count || 0, start, end },
    byType: typeRows.map((r) => ({ type: r._id, count: r.count })),
    byStatus: statusRows.map((r) => ({ status: r._id, count: r.count })),
    avgOrder: avgRow[0]?.avg || 0,
  };
}

/** Revenue series grouped by month from paid orders (payments). */
async function revenue({ tenantId, months = 6 }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const rows = await RestaurantPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: from } } },
    { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: 1, count: 1 } },
  ]);
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [thisMonth] = await RestaurantPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return { series: rows, currentMonth: thisMonth ? thisMonth.total : 0 };
}

/** Sales by hour today — handy for the day-part report. */
async function hourlySales({ tenantId, days = 1 }) {
  const daysBack = Math.min(7, Math.max(1, Number(days) || 1));
  const since = new Date();
  since.setHours(since.getHours() - daysBack * 24);
  return RestaurantPayment.aggregate([
    { $match: { tenantId: oid(tenantId), paidAt: { $gte: since } } },
    { $project: { hour: { $hour: "$paidAt" }, amount: "$amount" } },
    { $group: { _id: "$hour", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, hour: "$_id", total: 1, count: 1 } },
  ]);
}

/** Best-selling menu items by units + revenue. */
async function topItems({ tenantId, limit = 5, sinceDays = 7 }) {
  const since = new Date();
  since.setDate(since.getDate() - Math.min(30, Math.max(1, Number(sinceDays) || 7)));

  const paidOrders = await Order.find({ tenantId, paymentStatus: "PAID", paidAt: { $gte: since } }).select("_id").lean();
  if (paidOrders.length === 0) return [];
  const orderIds = paidOrders.map((o) => o._id);

  return OrderItem.aggregate([
    { $match: { tenantId: oid(tenantId), orderId: { $in: orderIds } } },
    {
      $group: {
        _id: "$menuItemId",
        units: { $sum: "$quantity" },
        revenue: { $sum: "$total" },
      },
    },
    { $sort: { units: -1 } },
    { $limit: limit },
    { $lookup: { from: "menuitems", localField: "_id", foreignField: "_id", as: "menuItem" } },
    { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, menuItemId: "$_id", name: "$menuItem.name", price: "$menuItem.price", units: 1, revenue: 1 } },
  ]);
}

async function tableStats({ tenantId }) {
  const [available, occupied, reserved, total] = await Promise.all([
    RestaurantTable.countDocuments({ tenantId, status: "AVAILABLE" }),
    RestaurantTable.countDocuments({ tenantId, status: "OCCUPIED" }),
    RestaurantTable.countDocuments({ tenantId, status: "RESERVED" }),
    RestaurantTable.countDocuments({ tenantId }),
  ]);
  return { available, occupied, reserved, total };
}

async function reservationStats({ tenantId, timezone }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const [today, upcoming, pending] = await Promise.all([
    Reservation.countDocuments({ tenantId, date: { $gte: todayStart, $lte: todayEnd }, status: { $in: ["PENDING", "CONFIRMED", "SEATED"] } }),
    Reservation.countDocuments({ tenantId, date: { $gte: now }, status: { $in: ["PENDING", "CONFIRMED"] } }),
    Reservation.countDocuments({ tenantId, status: "PENDING" }),
  ]);
  return { today, upcoming, pending };
}

async function inventoryStats({ tenantId }) {
  const [totalItems, lowStockCount, totalValue] = await Promise.all([
    RestaurantInventoryItem.countDocuments({ tenantId, isActive: true }),
    RestaurantInventoryItem.countDocuments({ tenantId, isActive: true, $expr: { $lte: ["$quantity", "$minStock"] } }),
    RestaurantInventoryItem.aggregate([
      { $match: { tenantId: oid(tenantId), isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPerUnit"] } } } },
    ]),
  ]);
  return { totalItems, lowStockCount, totalValue: totalValue[0]?.total || 0 };
}

async function expenseStats({ tenantId }) {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [thisMonth, todayRow] = await Promise.all([
    RestaurantExpense.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    RestaurantExpense.aggregate([
      { $match: { tenantId: oid(tenantId), date: { $gte: startOfDay(now) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  return { currentMonth: thisMonth[0]?.total || 0, monthCount: thisMonth[0]?.count || 0, today: todayRow[0]?.total || 0 };
}

async function payrollStats({ tenantId }) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await RestaurantSalary.aggregate([
    { $match: { tenantId: oid(tenantId), month } },
    { $group: { _id: null, total: { $sum: "$netPay" }, paid: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$netPay", 0] } }, count: { $sum: 1 } } },
  ]);
  const r = rows[0] || { total: 0, paid: 0, count: 0 };
  return { month, total: r.total, paid: r.paid, pending: +(r.total - r.paid).toFixed(2), count: r.count };
}

/** Open invoices that need collecting (customer tabs). */
async function pendingInvoices({ tenantId }) {
  const rows = await RestaurantInvoice.aggregate([
    { $match: { tenantId: oid(tenantId), status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] } } },
    { $group: { _id: "$status", count: { $sum: 1 }, outstanding: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } },
  ]);
  const summary = { pending: 0, partial: 0, overdue: 0, count: 0, totalOutstanding: 0 };
  for (const r of rows) {
    const key = r._id.toLowerCase();
    if (summary[key] !== undefined) summary[key] = r.count;
    summary.count += r.count;
    summary.totalOutstanding += r.outstanding;
  }
  summary.totalOutstanding = +summary.totalOutstanding.toFixed(2);
  return summary;
}

/** One-call dashboard payload for the restaurant home screen. */
async function dashboard({ tenantId }) {
  const settings = await RestaurantSettings.findOne({ tenantId }).select("timezone").lean();
  const tz = settings?.timezone || "Asia/Karachi";
  const [orders, rev, tables, reservations, inventory, expenses, payroll, invoices, customers, staffCount, menuCount, top] = await Promise.all([
    orderStats({ tenantId, timezone: tz }),
    revenue({ tenantId, months: 6 }),
    tableStats({ tenantId }),
    reservationStats({ tenantId, timezone: tz }),
    inventoryStats({ tenantId }),
    expenseStats({ tenantId }),
    payrollStats({ tenantId }),
    pendingInvoices({ tenantId }),
    customerStats({ tenantId }),
    RestaurantStaff.countDocuments({ tenantId, isActive: true }),
    MenuItem.countDocuments({ tenantId, isActive: true }),
    topItems({ tenantId, limit: 5 }),
  ]);
  return {
    orders,
    revenue: rev,
    tables,
    reservations,
    inventory,
    expenses,
    payroll,
    pendingInvoices: invoices,
    customers,
    staffCount,
    menuCount,
    topItems: top,
    generatedAt: new Date(),
  };
}

module.exports = {
  dashboard,
  revenue,
  topItems,
  hourlySales,
  orderStats,
  tableStats,
  reservationStats,
  customerStats,
  inventoryStats,
  expenseStats,
  payrollStats,
  pendingInvoices,
};