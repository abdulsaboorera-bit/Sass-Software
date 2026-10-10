"use strict";

/**
 * Restaurant module models. One vertical, self-contained: customers (with
 * loyalty), staff (chefs/waiters + salaries), a menu with tags, modifiers and
 * ingredient recipes linked to inventory, tables, reservations, orders with
 * line items, shifts, suppliers, raw-material inventory with stock movements,
 * operating expenses, payroll, staff attendance, invoices/payments, and
 * restaurant settings.
 */

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

// ── Customers ────────────────────────────────────────────
const customerSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerNo: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String },
    birthday: { type: Date },
    notes: { type: String },
    tags: { type: [String], default: [] },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    visits: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
customerSchema.index({ tenantId: 1, customerNo: 1 }, { unique: true });
customerSchema.index({ tenantId: 1, name: 1 });
customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, createdAt: -1 });

// ── Staff ────────────────────────────────────────────────
const staffSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    role: { type: String, required: true, trim: true }, // Chef, Waiter, Manager, Cashier...
    specialty: { type: String }, // e.g. "Grill", "Pastry"
    salary: { type: Number, default: 0, min: 0 }, // base monthly salary
    commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // % of served order value
    joinDate: { type: Date, default: Date.now },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
staffSchema.index({ tenantId: 1, name: 1 });

// ── Tables ───────────────────────────────────────────────
const tableSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 4, min: 1 },
    status: { type: String, enum: ["AVAILABLE", "OCCUPIED", "RESERVED"], default: "AVAILABLE", index: true },
    section: { type: String, index: true }, // Indoor, Outdoor, Private
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
tableSchema.index({ tenantId: 1, number: 1 }, { unique: true });

// ── Menu ─────────────────────────────────────────────────
const menuCategorySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
menuCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const modifierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // "Extra cheese", "Large"
    price: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const recipeItemSchema = new Schema(
  {
    inventoryItemId: { ...ref("RestaurantInventoryItem"), required: true },
    quantity: { type: Number, required: true, min: 0 }, // units of stock consumed per item
  },
  { _id: false }
);

const menuItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    categoryId: { ...ref("MenuCategory"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },
    imageUrl: { type: String },
    preparationTime: { type: Number, min: 0, default: 15 }, // minutes
    tags: { type: [String], default: [] }, // Bestseller, Chef's special, New
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    allergens: { type: [String], default: [] }, // Gluten, Nuts, Dairy...
    modifiers: [modifierSchema],
    recipe: [recipeItemSchema], // ingredients consumed from inventory per unit
    sellWithoutStock: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
menuItemSchema.index({ tenantId: 1, name: 1 });
menuItemSchema.index({ tenantId: 1, categoryId: 1 });

menuCategorySchema.virtual("menuItems", { ref: "MenuItem", localField: "_id", foreignField: "categoryId" });
menuItemSchema.virtual("category", { ref: "MenuCategory", localField: "categoryId", foreignField: "_id", justOne: true });

// ── Reservations ─────────────────────────────────────────
const reservationSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("RestaurantCustomer"), default: null, index: true },
    tableId: { ...ref("RestaurantTable"), default: null, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true }, // "19:30"
    guests: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    notes: { type: String },
  },
  baseOptions
);
reservationSchema.index({ tenantId: 1, date: 1 });
reservationSchema.index({ tenantId: 1, status: 1, date: 1 });

reservationSchema.virtual("customer", { ref: "RestaurantCustomer", localField: "customerId", foreignField: "_id", justOne: true });
reservationSchema.virtual("table", { ref: "RestaurantTable", localField: "tableId", foreignField: "_id", justOne: true });

// ── Orders ───────────────────────────────────────────────
const orderSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    orderNumber: { type: Number, required: true },
    customerId: { ...ref("RestaurantCustomer"), default: null, index: true },
    tableId: { ...ref("RestaurantTable"), default: null, index: true },
    reservedTable: { type: Number }, // snapshot of table number for records
    type: { type: String, enum: ["DINE_IN", "TAKEAWAY", "DELIVERY"], default: "DINE_IN", index: true },
    status: {
      type: String,
      enum: ["OPEN", "PREPARING", "SERVED", "COMPLETED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    serviceCharge: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["UNPAID", "PARTIAL", "PAID", "REFUNDED"], default: "UNPAID", index: true },
    paymentMethod: { type: String, enum: METHODS },
    paidAt: { type: Date, default: null },
    staffId: { ...ref("RestaurantStaff"), default: null }, // waiter who logged the order
    notes: { type: String },
    cancelledReason: { type: String },
  },
  baseOptions
);
orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

const orderItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    orderId: { ...ref("Order"), required: true, index: true },
    menuItemId: { ...ref("MenuItem"), required: true },
    menuItemName: { type: String }, // snapshot
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    modifiers: { type: [{ name: String, price: Number }], default: [] },
    modifierTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  baseOptions
);
orderItemSchema.index({ tenantId: 1, orderId: 1 });
orderItemSchema.virtual("menuItem", { ref: "MenuItem", localField: "menuItemId", foreignField: "_id", justOne: true });

orderSchema.virtual("customer", { ref: "RestaurantCustomer", localField: "customerId", foreignField: "_id", justOne: true });
orderSchema.virtual("table", { ref: "RestaurantTable", localField: "tableId", foreignField: "_id", justOne: true });
orderSchema.virtual("orderItems", { ref: "OrderItem", localField: "_id", foreignField: "orderId" });

// ── Shifts (staff schedule) ──────────────────────────────
const shiftSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    staffId: { ...ref("RestaurantStaff"), required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED"], default: "SCHEDULED", index: true },
  },
  baseOptions
);
shiftSchema.index({ tenantId: 1, date: 1 });
shiftSchema.virtual("staff", { ref: "RestaurantStaff", localField: "staffId", foreignField: "_id", justOne: true });

// ── Suppliers ────────────────────────────────────────────
const supplierSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String },
    category: { type: String }, // Produce, Meat, Dairy, Bakery, Beverages...
    paymentTerms: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
supplierSchema.index({ tenantId: 1, name: 1 });

// ── Inventory (raw materials / products) ─────────────────
const inventoryItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    category: { type: String, enum: ["RAW_MATERIAL", "BEVERAGE", "PACKAGING", "CLEANING", "OTHER"], default: "RAW_MATERIAL" },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, default: "kg" }, // kg, ltr, pcs, packs
    costPerUnit: { type: Number, required: true, min: 0 },
    minStock: { type: Number, min: 0, default: 0 },
    supplierId: { ...ref("Supplier"), default: null, index: true },
    location: { type: String }, // Dry store, Fridge, Freezer
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
inventoryItemSchema.index({ tenantId: 1, name: 1 });
inventoryItemSchema.index({ tenantId: 1, category: 1 });
inventoryItemSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
inventoryItemSchema.virtual("supplier", { ref: "Supplier", localField: "supplierId", foreignField: "_id", justOne: true });

const stockMovementSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    itemId: { ...ref("RestaurantInventoryItem"), required: true, index: true },
    type: { type: String, enum: ["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN", "ORDER"], required: true, index: true },
    quantity: { type: Number, required: true }, // signed; negative for consumption
    unitPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    reference: { type: String }, // PO-001, order #42, etc.
    notes: { type: String },
    createdBy: { ...ref("User") },
  },
  baseOptions
);
stockMovementSchema.index({ tenantId: 1, itemId: 1, createdAt: -1 });
stockMovementSchema.virtual("item", { ref: "RestaurantInventoryItem", localField: "itemId", foreignField: "_id", justOne: true });

// ── Expenses ─────────────────────────────────────────────
const expenseSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    category: {
      type: String,
      enum: ["RENT", "UTILITIES", "SALARY", "MAINTENANCE", "MARKETING", "FOOD", "BEVERAGES", "KITCHEN_EQUIPMENT", "SUPPLIES", "INSURANCE", "DELIVERY", "OTHER"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    reference: { type: String },
    recurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"] },
    status: { type: String, enum: ["PENDING", "APPROVED", "PAID"], default: "APPROVED" },
    notes: { type: String },
  },
  baseOptions
);
expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });

// ── Payroll (salaries) ───────────────────────────────────
const salarySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    staffId: { ...ref("RestaurantStaff"), required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    baseSalary: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 }, // waiters earn % of served orders
    bonuses: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING", index: true },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    notes: { type: String },
  },
  baseOptions
);
salarySchema.index({ tenantId: 1, staffId: 1, month: 1 }, { unique: true });
salarySchema.index({ tenantId: 1, month: 1 });
salarySchema.virtual("staff", { ref: "RestaurantStaff", localField: "staffId", foreignField: "_id", justOne: true });

// ── Staff attendance ─────────────────────────────────────
const attendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    staffId: { ...ref("RestaurantStaff"), required: true, index: true },
    date: { type: Date, required: true },
    dayKey: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE", "HALF_DAY"], default: "PRESENT" },
    checkIn: { type: String },
    checkOut: { type: String },
    notes: { type: String },
  },
  baseOptions
);
attendanceSchema.index({ tenantId: 1, staffId: 1, dayKey: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, dayKey: 1 });
attendanceSchema.virtual("staff", { ref: "RestaurantStaff", localField: "staffId", foreignField: "_id", justOne: true });

// ── Billing ──────────────────────────────────────────────
const invoiceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("RestaurantCustomer"), default: null, index: true },
    orderId: { ...ref("Order"), default: null, index: true },
    invoiceRef: { type: String, required: true }, // "RST-2607-8F3A2C"
    type: { type: String, enum: ["ORDER", "CUSTOMER", "OTHER"], default: "ORDER" },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    notes: { type: String },
  },
  baseOptions
);
invoiceSchema.index({ tenantId: 1, invoiceRef: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
invoiceSchema.virtual("balance").get(function () {
  return Math.max(0, Number(this.amount) - Number(this.paidAmount || 0));
});
invoiceSchema.virtual("customer", { ref: "RestaurantCustomer", localField: "customerId", foreignField: "_id", justOne: true });
invoiceSchema.virtual("order", { ref: "Order", localField: "orderId", foreignField: "_id", justOne: true });

const paymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("RestaurantCustomer"), default: null, index: true },
    orderId: { ...ref("Order"), default: null, index: true },
    invoiceId: { ...ref("RestaurantInvoice"), default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, default: "ORDER" },
    method: { type: String, enum: METHODS, required: true },
    reference: { type: String },
    paidAt: { type: Date, default: Date.now, index: true },
  },
  baseOptions
);
paymentSchema.index({ tenantId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, orderId: 1 });
paymentSchema.virtual("customer", { ref: "RestaurantCustomer", localField: "customerId", foreignField: "_id", justOne: true });

// ── Settings ─────────────────────────────────────────────
const operatingHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, unique: true, index: true },
    restaurantName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    serviceChargeRate: { type: Number, default: 0, min: 0, max: 100 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    floorSections: { type: [String], default: ["Indoor", "Outdoor"] },
    operatingHours: [operatingHoursSchema],
  },
  baseOptions
);

module.exports = {
  RestaurantCustomer: mongoose.models.RestaurantCustomer || mongoose.model("RestaurantCustomer", customerSchema),
  RestaurantStaff: mongoose.models.RestaurantStaff || mongoose.model("RestaurantStaff", staffSchema),
  RestaurantTable: mongoose.models.RestaurantTable || mongoose.model("RestaurantTable", tableSchema),
  MenuCategory: mongoose.models.MenuCategory || mongoose.model("MenuCategory", menuCategorySchema),
  MenuItem: mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema),
  Reservation: mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema),
  OrderItem: mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema),
  Shift: mongoose.models.Shift || mongoose.model("Shift", shiftSchema),
  Supplier: mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema),
  RestaurantInventoryItem: mongoose.models.RestaurantInventoryItem || mongoose.model("RestaurantInventoryItem", inventoryItemSchema),
  RestaurantStockMovement: mongoose.models.RestaurantStockMovement || mongoose.model("RestaurantStockMovement", stockMovementSchema),
  RestaurantExpense: mongoose.models.RestaurantExpense || mongoose.model("RestaurantExpense", expenseSchema),
  RestaurantSalary: mongoose.models.RestaurantSalary || mongoose.model("RestaurantSalary", salarySchema),
  RestaurantAttendance: mongoose.models.RestaurantAttendance || mongoose.model("RestaurantAttendance", attendanceSchema),
  RestaurantInvoice: mongoose.models.RestaurantInvoice || mongoose.model("RestaurantInvoice", invoiceSchema),
  RestaurantPayment: mongoose.models.RestaurantPayment || mongoose.model("RestaurantPayment", paymentSchema),
  RestaurantSettings: mongoose.models.RestaurantSettings || mongoose.model("RestaurantSettings", settingsSchema),
};