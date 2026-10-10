"use strict";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mongoose = require("mongoose");
require("../src/app");

const {
  Tenant,
  RestaurantCustomer,
  RestaurantStaff,
  RestaurantTable,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  RestaurantInventoryItem,
  RestaurantStockMovement,
  RestaurantInvoice,
  RestaurantPayment,
  RestaurantExpense,
  Reservation,
} = require("../src/models");
const orderService = require("../src/services/restaurant/order.service");
const inventory = require("../src/services/restaurant/inventory.service");
const payroll = require("../src/services/restaurant/payroll.service");
const analytics = require("../src/services/restaurant/analytics.service");
const billing = require("../src/services/restaurant/billing.service");

const TEST_URI = "mongodb://127.0.0.1:27017/nexus_saas_restaurant_test";
let databaseAvailable = false;
let tenant;
let customer;
let staff;
let waiter;
let table;
let item;
let ingredient;

before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1000 });
    await mongoose.connection.dropDatabase();
    databaseAvailable = true;

    tenant = await Tenant.create({ slug: `restaurant-${Date.now()}`, name: "Integration Restaurant", industry: "RESTAURANT" });
    customer = await RestaurantCustomer.create({ tenantId: tenant._id, customerNo: "C-0001", name: "Integration Guest", phone: "03000000000" });
    staff = await RestaurantStaff.create({ tenantId: tenant._id, name: "Chef Sam", phone: "03000000001", role: "Chef", salary: 30000, commissionRate: 0 });
    waiter = await RestaurantStaff.create({ tenantId: tenant._id, name: "Waiter Joe", phone: "03000000002", role: "Waiter", salary: 20000, commissionRate: 10 });
    table = await RestaurantTable.create({ tenantId: tenant._id, number: 1, capacity: 4, status: "AVAILABLE" });

    ingredient = await RestaurantInventoryItem.create({
      tenantId: tenant._id,
      name: "Chicken Fillet",
      quantity: 50,
      unit: "pcs",
      costPrice: 150,
      lowStockThreshold: 10,
    });

    const cat = await MenuCategory.create({ tenantId: tenant._id, name: "Main" });
    item = await MenuItem.create({
      tenantId: tenant._id,
      categoryId: cat._id,
      name: "Chicken Gravy",
      price: 1000,
      costPrice: 300,
      recipe: [{ inventoryItemId: ingredient._id, quantity: 1 }],
      preparationTime: 15,
    });
  } catch {
    databaseAvailable = false;
    await mongoose.disconnect().catch(() => {});
  }
});

after(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

test("order creation, stock deduction and checkout frees table and records payment", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const order = await orderService.create({
    tenantId: tenant._id,
    data: {
      tableId: table._id,
      customerId: customer._id,
      staffId: waiter._id,
      type: "DINE_IN",
      items: [{ menuItemId: item._id, quantity: 2 }],
    },
  });
  assert.equal(order.orderNumber, 1);
  assert.equal(order.total, 2000);

  // Stock deducted on checkout path? Let us check: our service deducts inventory
  // during checkout when recipe exists; ensure it did.
  const ing = await RestaurantInventoryItem.findById(ingredient._id);
  assert.equal(ing.quantity, 50 - 2);

  const checkout = await orderService.checkout({ tenantId: tenant._id, id: order._id, data: { method: "CASH" } });
  assert.equal(checkout.order.paymentStatus, "PAID");
  assert.equal(checkout.order.status, "COMPLETED");
  const t2 = await RestaurantTable.findById(table._id);
  assert.equal(t2.status, "AVAILABLE");
  assert.ok((await RestaurantPayment.countDocuments({ tenantId: tenant._id, orderId: order._id })) >= 1);
  if (customer) {
    const c = await RestaurantCustomer.findById(customer._id);
    assert.ok(c.visits >= 1);
    assert.ok(c.totalSpent >= 2000);
  }
});

test("insufficient stock blocks order checkout", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const ingredient2 = await RestaurantInventoryItem.create({
    tenantId: tenant._id,
    name: "Beef",
    quantity: 1,
    unit: "pcs",
    costPrice: 200,
  });
  const cat = await MenuCategory.create({ tenantId: tenant._id, name: "Grill" });
  const beefItem = await MenuItem.create({
    tenantId: tenant._id,
    categoryId: cat._id,
    name: "Beef Steak",
    price: 1500,
    costPrice: 400,
    recipe: [{ inventoryItemId: ingredient2._id, quantity: 5 }],
  });
  const table2 = await RestaurantTable.create({ tenantId: tenant._id, number: 2, capacity: 2, status: "AVAILABLE" });
  const order = await orderService.create({
    tenantId: tenant._id,
    data: { tableId: table2._id, type: "DINE_IN", items: [{ menuItemId: beefItem._id, quantity: 1 }] },
  });
  await assert.rejects(
    orderService.checkout({ tenantId: tenant._id, id: order._id, data: { method: "CASH" } }),
    /Insufficient stock/
  );
  const ing2 = await RestaurantInventoryItem.findById(ingredient2._id);
  assert.equal(ing2.quantity, 1);
});

test("payroll computes commission for waiter on completed paid orders", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const res = await payroll.generate({ tenantId: tenant._id, month, overwrite: true });
  const salary = res.results.find((r) => String(r.staffId) === String(waiter._id));
  assert.ok(salary);
  assert.ok(salary.commission > 0);
  assert.equal(salary.baseSalary, waiter.salary);
});

test("analytics dashboard returns scoped metrics", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const dash = await analytics.dashboard({ tenantId: tenant._id });
  assert.ok(dash.orders.total >= 1);
  assert.ok(dash.revenue.total >= 2000);
  assert.ok(Array.isArray(dash.topItems));
});

test("billing creates invoice and reconciles payments with conflict detection", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const invoice = await billing.createInvoice({ tenantId: tenant._id, customerId: customer._id, amount: 1500, type: "OTHER" });
  assert.equal(invoice.status, "PENDING");
  const partial = await billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 500, method: "CASH" });
  assert.equal(partial.invoice.status, "PARTIAL");
  await assert.rejects(
    billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 1100, method: "CASH" }),
    /outstanding/
  );
  const paid = await billing.recordPayment({ tenantId: tenant._id, invoiceId: invoice._id, amount: 1000, method: "CARD" });
  assert.equal(paid.invoice.status, "PAID");
  await billing.deletePayment({ tenantId: tenant._id, id: paid.payment._id || paid.payment.id });
  const reopened = await RestaurantInvoice.findById(invoice._id).lean();
  assert.equal(reopened.status, "PARTIAL");
  assert.equal(reopened.paidAmount, 500);
});

test("reservation status transitions manage table occupancy", async (t) => {
  if (!databaseAvailable) return t.skip("MongoDB is unavailable");
  const t3 = await RestaurantTable.create({ tenantId: tenant._id, number: 3, capacity: 6, status: "AVAILABLE" });
  const res = await Reservation.create({ tenantId: tenant._id, name: "Guest", phone: "03009999999", date: new Date(), time: "19:30", guests: 4, tableId: t3._id, status: "PENDING" });
  await Reservation.findByIdAndUpdate(res._id, { status: "CONFIRMED" });
  const updated = await RestaurantTable.findById(t3._id);
  assert.equal(updated.status, "RESERVED");
});
