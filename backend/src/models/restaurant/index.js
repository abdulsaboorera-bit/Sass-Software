"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

const staffSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    salary: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

const tableSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 4 },
    status: { type: String, default: "AVAILABLE" },
    section: { type: String },
  },
  baseOptions
);
tableSchema.index({ tenantId: 1, number: 1 }, { unique: true });

const menuCategorySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  baseOptions
);
menuCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const menuItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    categoryId: { ...ref("MenuCategory"), required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    costPrice: { type: Number },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    preparationTime: { type: Number },
  },
  baseOptions
);

const orderSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    orderNumber: { type: Number, required: true },
    tableId: { ...ref("RestaurantTable"), default: null },
    staffId: { ...ref("Staff"), default: null },
    type: { type: String, default: "DINE_IN" },
    status: { type: String, default: "OPEN" },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: METHODS },
    paidAt: { type: Date },
  },
  baseOptions
);
orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, createdAt: -1 });

const orderItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    orderId: { ...ref("Order"), required: true, index: true },
    menuItemId: { ...ref("MenuItem"), required: true },
    staffId: { ...ref("Staff"), default: null },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    notes: { type: String },
  },
  baseOptions
);

const shiftSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    staffId: { ...ref("Staff"), required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, default: "SCHEDULED" },
  },
  baseOptions
);
shiftSchema.index({ tenantId: 1, date: 1 });

const supplierSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    category: { type: String },
  },
  baseOptions
);

const inventoryItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    category: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minStock: { type: Number, default: 0 },
    costPerUnit: { type: Number, required: true },
    supplierId: { ...ref("Supplier"), default: null },
  },
  baseOptions
);

// Relation aliases the frontend reads (order.table, order.orderItems, orderItem.menuItem, category.menuItems).
orderSchema.virtual("table", { ref: "RestaurantTable", localField: "tableId", foreignField: "_id", justOne: true });
orderSchema.virtual("orderItems", { ref: "OrderItem", localField: "_id", foreignField: "orderId" });
orderItemSchema.virtual("menuItem", { ref: "MenuItem", localField: "menuItemId", foreignField: "_id", justOne: true });
menuItemSchema.virtual("category", { ref: "MenuCategory", localField: "categoryId", foreignField: "_id", justOne: true });
menuCategorySchema.virtual("menuItems", { ref: "MenuItem", localField: "_id", foreignField: "categoryId" });

module.exports = {
  Staff: mongoose.models.Staff || mongoose.model("Staff", staffSchema),
  RestaurantTable: mongoose.models.RestaurantTable || mongoose.model("RestaurantTable", tableSchema),
  MenuCategory: mongoose.models.MenuCategory || mongoose.model("MenuCategory", menuCategorySchema),
  MenuItem: mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema),
  OrderItem: mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema),
  Shift: mongoose.models.Shift || mongoose.model("Shift", shiftSchema),
  Supplier: mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema),
  InventoryItem: mongoose.models.InventoryItem || mongoose.model("InventoryItem", inventoryItemSchema),
};
