"use strict";

const mongoose = require("mongoose");
const {
  Order,
  OrderItem,
  MenuItem,
  RestaurantTable,
  RestaurantCustomer,
  RestaurantInventoryItem,
  RestaurantStockMovement,
  RestaurantPayment,
  RestaurantInvoice,
  RestaurantSettings,
} = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { sanitize } = require("../../utils/crud");
const { invoiceRef } = require("../../utils/ids");

/** Next per-tenant sequential order number. */
async function nextOrderNumber(tenantId) {
  const last = await Order.findOne({ tenantId }).sort({ orderNumber: -1 }).select("orderNumber").lean();
  return (last && last.orderNumber ? last.orderNumber : 0) + 1;
}

async function getSettingsValue(tenantId, key, fallback = 0) {
  const settings = await RestaurantSettings.findOne({ tenantId }).select(key).lean();
  return settings?.[key] ?? fallback;
}

/**
 * Create an order with line items and computed totals.
 * body: { tableId?, customerId?, staffId?, type, items:[{menuItemId,quantity,modifiers,notes}],
 *         tax?, discount?, serviceCharge?, deliveryFee? }
 */
async function create({ tenantId, data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) throw ApiError.badRequest("Add at least one item");

  const menuIds = items.map((i) => i.menuItemId).filter(Boolean);
  const menuItems = await MenuItem.find({ _id: { $in: menuIds }, tenantId, isActive: true }).lean();
  if (menuItems.length !== new Set(menuIds).size) throw ApiError.badRequest("One or more menu items are invalid or unavailable");
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  let subtotal = 0;
  const lineItems = items.map(({ menuItemId, quantity = 1, modifiers = [], notes }) => {
    const mi = byId.get(String(menuItemId));
    const unitPrice = Number(mi.price);
    const mods = Array.isArray(modifiers) ? modifiers.filter((m) => m && m.name) : [];
    const modifierTotal = mods.reduce((sum, m) => sum + Number(m.price || 0), 0);
    const total = (unitPrice + modifierTotal) * quantity;
    subtotal += total;
    return { tenantId, menuItemId: mi._id, menuItemName: mi.name, quantity, unitPrice, modifiers: mods, modifierTotal, total, notes };
  });

  const type = data.type || "DINE_IN";
  const subtotalRounded = +subtotal.toFixed(2);
  const tax = data.tax !== undefined ? Number(data.tax || 0) : Math.round(subtotalRounded * (Number(await getSettingsValue(tenantId, "taxRate")) || 0)) / 100;
  const serviceCharge = data.serviceCharge !== undefined ? Number(data.serviceCharge || 0) : type === "DINE_IN" ? Math.round(subtotalRounded * (Number(await getSettingsValue(tenantId, "serviceChargeRate")) || 0)) / 100 : 0;
  const deliveryFee = data.deliveryFee !== undefined ? Number(data.deliveryFee || 0) : type === "DELIVERY" ? Number(await getSettingsValue(tenantId, "deliveryFee")) || 0 : 0;
  const discount = Number(data.discount || 0);
  if (discount < 0 || discount > subtotalRounded + tax + serviceCharge + deliveryFee) throw ApiError.badRequest("Invalid discount amount");
  const total = Math.max(0, +(subtotalRounded + tax + serviceCharge + deliveryFee - discount).toFixed(2));

  const tableId = data.tableId || null;
  if (type === "DINE_IN" && tableId) {
    const table = await RestaurantTable.findOne({ _id: tableId, tenantId });
    if (!table) throw ApiError.badRequest("Selected table was not found");
    if (table.status === "OCCUPIED") throw ApiError.badRequest("Selected table is already occupied");
  }

  if (data.customerId) {
    const customer = await RestaurantCustomer.exists({ _id: data.customerId, tenantId });
    if (!customer) throw ApiError.badRequest("Invalid customer");
  }

  const order = await Order.create({
    tenantId,
    orderNumber: await nextOrderNumber(tenantId),
    customerId: data.customerId || null,
    tableId: tableId || null,
    reservedTable: tableId ? await RestaurantTable.findOne({ _id: tableId, tenantId }).select("number").lean().then((t) => t?.number) : null,
    staffId: data.staffId || null,
    type,
    status: "OPEN",
    subtotal: subtotalRounded,
    tax: +tax.toFixed(2),
    serviceCharge: +serviceCharge.toFixed(2),
    discount: +discount.toFixed(2),
    deliveryFee: +deliveryFee.toFixed(2),
    total,
    notes: data.notes,
  });

  const created = await OrderItem.insertMany(lineItems.map((li) => ({ ...li, orderId: order._id })));
  if (tableId && type === "DINE_IN") await RestaurantTable.updateOne({ _id: tableId, tenantId }, { $set: { status: "OCCUPIED" } });
  return { order: order.toObject(), items: created };
}

/** Fetch an order with its table + line items, menu item names and optional customer. */
async function getById({ tenantId, id }) {
  const order = await Order.findOne({ _id: id, tenantId })
    .populate("table", "number")
    .populate("customer", "name phone customerNo")
    .populate({ path: "orderItems", populate: { path: "menuItem", select: "name price" } })
    .lean({ virtuals: true });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

async function update({ tenantId, id, data }) {
  const allowed = sanitize(data);
  for (const f of ["orderNumber", "subtotal", "tax", "serviceCharge", "deliveryFee", "total", "reservedTable"]) delete allowed[f];
  const order = await Order.findOne({ _id: id, tenantId });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status === "CANCELLED" || order.paymentStatus === "PAID") {
    const editable = Object.keys(allowed).every((k) => k === "notes" || k === "paymentMethod" || k === "cancelledReason");
    if (!editable) throw ApiError.badRequest("A cancelled or paid order can only be edited minimally");
  }
  const updated = await Order.findOneAndUpdate({ _id: id, tenantId }, { $set: allowed }, { new: true, runValidators: true })
    .populate("table", "number")
    .populate("customer", "name phone")
    .lean({ virtuals: true });
  if (!updated) throw ApiError.notFound("Order not found");
  return updated;
}

/** Advance/kill the kitchen state. Frees the table when the order leaves service. */
async function setStatus({ tenantId, id, status, cancelledReason }) {
  const valid = ["OPEN", "PREPARING", "SERVED", "COMPLETED", "CANCELLED"];
  if (!valid.includes(status)) throw ApiError.badRequest("Invalid order status");
  const order = await Order.findOneAndUpdate({ _id: id, tenantId }, { $set: { status, ...(status === "CANCELLED" ? { cancelledReason: cancelledReason || "Cancelled" } : {}) } }, { new: true });
  if (!order) throw ApiError.notFound("Order not found");
  if (status === "CANCELLED" && order.tableId) {
    await RestaurantTable.updateOne({ _id: order.tableId, tenantId, status: "OCCUPIED" }, { $set: { status: "AVAILABLE" } });
  }
  return order;
}

/** Server-side recompute of an open order's totals (used after line-item edits). */
async function recalcOrderTotals({ tenantId, id }) {
  const order = await Order.findOne({ _id: id, tenantId, paymentStatus: { $ne: "PAID" }, status: { $ne: "CANCELLED" } });
  if (!order) throw ApiError.notFound("Open order not found");
  const remaining = await OrderItem.find({ orderId: id, tenantId }).lean();
  const subtotal = remaining.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const tax = Number(order.tax || 0);
  const serviceCharge = Number(order.serviceCharge || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Math.min(Number(order.discount || 0), subtotal + tax + serviceCharge + deliveryFee);
  const total = Math.max(0, subtotal + tax + serviceCharge + deliveryFee - discount);
  return Order.findOneAndUpdate(
    { _id: id, tenantId },
    {
      $set: {
        subtotal: +subtotal.toFixed(2),
        discount: +discount.toFixed(2),
        total: +total.toFixed(2),
      },
    },
    { new: true }
  );
}

/** Deduct the inventory consumed by an order's line items via their recipes. */
async function deductInventory({ tenantId, orderId }) {
  const lineItems = await OrderItem.find({ orderId, tenantId }).lean();
  if (lineItems.length === 0) return { consumed: 0 };

  // Collect every recipe line across the order with its required quantity.
  const menuIds = [...new Set(lineItems.map((li) => String(li.menuItemId)))];
  const menuItems = await MenuItem.find({ _id: { $in: menuIds }, tenantId }).select("recipe sellWithoutStock").lean();
  const menuById = new Map(menuItems.map((m) => [String(m._id), m]));

  const needs = [];
  for (const line of lineItems) {
    const menu = menuById.get(String(line.menuItemId));
    const recipe = menu?.recipe || [];
    if (!menu?.sellWithoutStock && recipe.length) {
      for (const r of recipe) {
        needs.push({ itemId: String(r.inventoryItemId), quantity: Number(r.quantity) * line.quantity });
      }
    }
  }
  if (needs.length === 0) return { consumed: 0 };

  // Pre-check every ingredient so a shortage fails before any mutation.
  const totals = new Map();
  for (const n of needs) totals.set(n.itemId, (totals.get(n.itemId) || 0) + n.quantity);

  const applied = [];
  const failed = [];
  for (const [itemId, qty] of totals) {
    const item = await RestaurantInventoryItem.findOne({ _id: itemId, tenantId }).select("name quantity").lean();
    if (!item) { failed.push({ name: "(missing ingredient)", available: 0 }); break; }
    if (Number(item.quantity) < qty) { failed.push({ name: item.name, available: item.quantity }); break; }

    const updated = await RestaurantInventoryItem.findOneAndUpdate(
      { _id: itemId, tenantId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) { failed.push({ name: item.name, available: item.quantity }); break; }
    applied.push({ itemId, qty });
  }

  if (failed.length) {
    // Roll back everything already deducted so the order stays untouched.
    for (const a of applied) await RestaurantInventoryItem.updateOne({ _id: a.itemId, tenantId }, { $inc: { quantity: a.qty } });
    throw ApiError.badRequest(`Insufficient stock to prepare the order (${failed.map((f) => f.name).join(", ")})`);
  }

  try {
    await RestaurantStockMovement.insertMany(
      applied.map((a) => ({
        tenantId,
        itemId: a.itemId,
        type: "ORDER",
        quantity: -a.qty,
        totalCost: 0,
        reference: `Order #${orderId}`,
        notes: "Consumed to prepare order",
      }))
    );
  } catch (err) {
    for (const a of applied) await RestaurantInventoryItem.updateOne({ _id: a.itemId, tenantId }, { $inc: { quantity: a.qty } });
    throw err;
  }
  return { consumed: applied.length };
}

/**
 * Settle an order: mark COMPLETED + PAID/PARTIAL, record the payment, free
 * the table, deduct the ingredients and bump the customer's spend/loyalty.
 * Returns { order, payment, invoice? }.
 */
async function checkout({ tenantId, id, data }) {
  const order = await Order.findOne({ _id: id, tenantId })
    .populate("orderItems")
    .populate("customer", "name phone customerNo");
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status === "CANCELLED") throw ApiError.badRequest("A cancelled order cannot be checked out");
  if (order.paymentStatus === "PAID") throw ApiError.badRequest("Order is already paid");
  if (order.status !== "COMPLETED") {
    // Serve first: kitchen flow must reach SERVED before payment.
    if (order.status === "OPEN") order.status = "PREPARING";
    if (order.status === "PREPARING") order.status = "SERVED";
  }

  const method = data.method;
  if (method && !["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"].includes(method)) {
    throw ApiError.badRequest("Invalid payment method");
  }
  const total = Number(order.total);
  const paid = Number(data.amount ?? total);
  if (!Number.isFinite(paid) || paid <= 0) throw ApiError.badRequest("A valid payment amount is required");
  if (paid > total) throw ApiError.badRequest(`Payment (${paid}) exceeds the order total (${total})`);
  const remaining = Number(order.paidAmount || 0) + paid; // paidAmount is not persisted pre-checkout
  const paymentStatus = remaining >= total ? "PAID" : "PARTIAL";

  // Deduct ingredients only when the order is fully settled.
  if (paymentStatus === "PAID") await deductInventory({ tenantId, orderId: order._id });

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, tenantId },
    {
      $set: {
        status: "COMPLETED",
        paymentStatus,
        paymentMethod: method || null,
        paidAt: new Date(),
      },
    },
    { new: true }
  );

  // Free the table now that the meal is paid.
  if (order.tableId && updated.paymentStatus === "PAID") {
    await RestaurantTable.updateOne({ _id: order.tableId, tenantId, status: "OCCUPIED" }, { $set: { status: "AVAILABLE" } });
  }

  const payment = await RestaurantPayment.create({
    tenantId,
    customerId: order.customerId || null,
    orderId: order._id,
    amount: paid,
    type: "ORDER",
    method: method || "CASH",
  });

  let invoice = null;
  const settledFully = paymentStatus === "PAID";
  if (order.customerId && settledFully) {
    invoice = await RestaurantInvoice.create({
      tenantId,
      customerId: order.customerId,
      orderId: order._id,
      invoiceRef: invoiceRef("RST"),
      type: "ORDER",
      amount: total,
      paidAmount: remaining,
      status: "PAID",
      dueDate: new Date(),
      paidAt: new Date(),
      notes: `Order #${order.orderNumber}`,
    });
    await RestaurantCustomer.findOneAndUpdate(
      { _id: order.customerId, tenantId },
      { $inc: { totalSpent: total, visits: 1, loyaltyPoints: Math.floor(total / 100) }, $set: { lastVisitAt: new Date() } }
    );
  }

  return { order: updated.toObject(), payment: payment.toObject(), invoice: invoice ? invoice.toObject() : null };
}

async function remove({ tenantId, id }) {
  const order = await Order.findOneAndDelete({ _id: id, tenantId });
  if (!order) throw ApiError.notFound("Order not found");
  await OrderItem.deleteMany({ orderId: id, tenantId });
  if (order.tableId) await RestaurantTable.updateOne({ _id: order.tableId, tenantId, status: "OCCUPIED" }, { $set: { status: "AVAILABLE" } });
  return { success: true };
}

module.exports = { create, getById, update, setStatus, checkout, remove, nextOrderNumber, deductInventory };