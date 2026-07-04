"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

const bookSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    isbn: { type: String },
    title: { type: String, required: true },
    author: { type: String, required: true },
    publisher: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
bookSchema.index({ tenantId: 1, title: 1 });
bookSchema.index({ isbn: 1 });

const categorySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  baseOptions
);
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const bookCustomerSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    loyaltyPoints: { type: Number, default: 0 },
  },
  baseOptions
);

const saleSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    invoiceNo: { type: String, required: true },
    customerId: { ...ref("BookCustomer"), default: null },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    paidAt: { type: Date, default: Date.now },
  },
  baseOptions
);
saleSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, createdAt: -1 });

const saleItemSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    saleId: { ...ref("Sale"), required: true, index: true },
    bookId: { ...ref("Book"), required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  baseOptions
);

const loyaltyPointSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("BookCustomer"), required: true, index: true },
    points: { type: Number, required: true },
    type: { type: String, required: true },
    description: { type: String },
  },
  baseOptions
);

const purchaseOrderSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    orderNo: { type: String, required: true },
    supplierName: { type: String, required: true },
    items: { type: Schema.Types.Mixed, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "PENDING" },
    expectedDate: { type: Date },
    receivedAt: { type: Date },
  },
  baseOptions
);
purchaseOrderSchema.index({ tenantId: 1, orderNo: 1 }, { unique: true });

// Relation aliases the frontend reads (sale.customer, sale.saleItems, saleItem.book).
saleSchema.virtual("customer", { ref: "BookCustomer", localField: "customerId", foreignField: "_id", justOne: true });
saleSchema.virtual("saleItems", { ref: "SaleItem", localField: "_id", foreignField: "saleId" });
saleItemSchema.virtual("book", { ref: "Book", localField: "bookId", foreignField: "_id", justOne: true });

module.exports = {
  Book: mongoose.models.Book || mongoose.model("Book", bookSchema),
  Category: mongoose.models.Category || mongoose.model("Category", categorySchema),
  BookCustomer: mongoose.models.BookCustomer || mongoose.model("BookCustomer", bookCustomerSchema),
  Sale: mongoose.models.Sale || mongoose.model("Sale", saleSchema),
  SaleItem: mongoose.models.SaleItem || mongoose.model("SaleItem", saleItemSchema),
  LoyaltyPoint: mongoose.models.LoyaltyPoint || mongoose.model("LoyaltyPoint", loyaltyPointSchema),
  PurchaseOrder: mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema),
};
