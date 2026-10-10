"use strict";

/**
 * Salon module models. One vertical, self-contained: customers, a service
 * catalogue, staff (with salary + commission), appointments, retail products,
 * stock movements, invoices/payments, operating expenses, payroll (salaries),
 * staff attendance, and salon settings.
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
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    dateOfBirth: { type: Date },
    address: { type: String },
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

// ── Service catalogue ────────────────────────────────────
const serviceCategorySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
serviceCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const serviceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    categoryId: { ...ref("SalonServiceCategory"), default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: Number, default: 30, min: 0 }, // minutes
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // % of price paid to staff
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
serviceSchema.index({ tenantId: 1, name: 1 });
serviceSchema.index({ tenantId: 1, categoryId: 1 });

// ── Staff ────────────────────────────────────────────────
const staffSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    role: { type: String, required: true, trim: true }, // Stylist, Beautician, Manager, Receptionist...
    specialization: { type: String },
    salary: { type: Number, default: 0, min: 0 }, // base monthly salary
    commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // default % for services
    joinDate: { type: Date, default: Date.now },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
staffSchema.index({ tenantId: 1, name: 1 });

// ── Appointments ─────────────────────────────────────────
const appointmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("SalonCustomer"), required: true, index: true },
    staffId: { ...ref("SalonStaff"), default: null, index: true },
    serviceIds: { type: [Schema.Types.ObjectId], ref: "SalonService", default: [] },
    date: { type: Date, required: true, index: true },
    startTime: { type: String }, // "14:30"
    endTime: { type: String },
    duration: { type: Number, default: 0 }, // total minutes
    amount: { type: Number, default: 0, min: 0 }, // sum of service prices
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }, // amount - discount
    status: {
      type: String,
      enum: ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
      index: true,
    },
    paymentStatus: { type: String, enum: ["UNPAID", "PAID"], default: "UNPAID" },
    notes: { type: String },
  },
  baseOptions
);
appointmentSchema.index({ tenantId: 1, date: 1, startTime: 1 });
appointmentSchema.index({ tenantId: 1, status: 1 });
appointmentSchema.index({ tenantId: 1, customerId: 1, date: -1 });

appointmentSchema.virtual("customer", { ref: "SalonCustomer", localField: "customerId", foreignField: "_id", justOne: true });
appointmentSchema.virtual("staff", { ref: "SalonStaff", localField: "staffId", foreignField: "_id", justOne: true });
appointmentSchema.virtual("services", { ref: "SalonService", localField: "serviceIds", foreignField: "_id" });

// ── Retail products / inventory ──────────────────────────
const productSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["HAIRCARE", "SKINCARE", "COSMETICS", "TOOLS", "CONSUMABLE", "OTHER"], default: "OTHER" },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger, default: 0 },
    unit: { type: String, required: true, default: "pcs" },
    costPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, min: 0, default: 0 },
    minStock: { type: Number, min: 0, validate: Number.isInteger, default: 5 },
    supplierName: { type: String },
    location: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });

const stockMovementSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    itemId: { ...ref("SalonProduct"), required: true, index: true },
    type: { type: String, enum: ["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"], required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    reference: { type: String },
    notes: { type: String },
    createdBy: { ...ref("User") },
  },
  baseOptions
);
stockMovementSchema.index({ tenantId: 1, itemId: 1, createdAt: -1 });
stockMovementSchema.virtual("item", { ref: "SalonProduct", localField: "itemId", foreignField: "_id", justOne: true });

// ── Billing ──────────────────────────────────────────────
const invoiceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("SalonCustomer"), required: true, index: true },
    appointmentId: { ...ref("SalonAppointment"), default: null },
    invoiceRef: { type: String, required: true }, // e.g. "SAL-2607-8F3A2C"
    type: { type: String, enum: ["SERVICE", "PRODUCT", "APPOINTMENT", "MEMBERSHIP", "OTHER"], default: "SERVICE" },
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
invoiceSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });
invoiceSchema.virtual("balance").get(function () {
  return Math.max(0, Number(this.amount) - Number(this.paidAmount || 0));
});

const paymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    customerId: { ...ref("SalonCustomer"), required: true, index: true },
    invoiceId: { ...ref("SalonInvoice"), default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, default: "SERVICE" },
    method: { type: String, enum: METHODS, required: true },
    reference: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  baseOptions
);
paymentSchema.index({ tenantId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, customerId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, invoiceId: 1, paidAt: -1 });

// ── Expenses ─────────────────────────────────────────────
const expenseSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    category: {
      type: String,
      enum: ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "INSURANCE", "OTHER"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    reference: { type: String },
    recurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"] },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], default: "APPROVED" },
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
    staffId: { ...ref("SalonStaff"), required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    baseSalary: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
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
salarySchema.virtual("staff", { ref: "SalonStaff", localField: "staffId", foreignField: "_id", justOne: true });

// ── Staff attendance ─────────────────────────────────────
const attendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    staffId: { ...ref("SalonStaff"), required: true, index: true },
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
attendanceSchema.virtual("staff", { ref: "SalonStaff", localField: "staffId", foreignField: "_id", justOne: true });

// ── Settings ─────────────────────────────────────────────
const operatingHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, unique: true, index: true },
    salonName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    operatingHours: [operatingHoursSchema],
    defaultCommissionRate: { type: Number, default: 0, min: 0, max: 100 },
    defaultAppointmentDuration: { type: Number, default: 30 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  baseOptions
);

module.exports = {
  SalonCustomer: mongoose.models.SalonCustomer || mongoose.model("SalonCustomer", customerSchema),
  SalonServiceCategory: mongoose.models.SalonServiceCategory || mongoose.model("SalonServiceCategory", serviceCategorySchema),
  SalonService: mongoose.models.SalonService || mongoose.model("SalonService", serviceSchema),
  SalonStaff: mongoose.models.SalonStaff || mongoose.model("SalonStaff", staffSchema),
  SalonAppointment: mongoose.models.SalonAppointment || mongoose.model("SalonAppointment", appointmentSchema),
  SalonProduct: mongoose.models.SalonProduct || mongoose.model("SalonProduct", productSchema),
  SalonStockMovement: mongoose.models.SalonStockMovement || mongoose.model("SalonStockMovement", stockMovementSchema),
  SalonInvoice: mongoose.models.SalonInvoice || mongoose.model("SalonInvoice", invoiceSchema),
  SalonPayment: mongoose.models.SalonPayment || mongoose.model("SalonPayment", paymentSchema),
  SalonExpense: mongoose.models.SalonExpense || mongoose.model("SalonExpense", expenseSchema),
  SalonSalary: mongoose.models.SalonSalary || mongoose.model("SalonSalary", salarySchema),
  SalonAttendance: mongoose.models.SalonAttendance || mongoose.model("SalonAttendance", attendanceSchema),
  SalonSettings: mongoose.models.SalonSettings || mongoose.model("SalonSettings", settingsSchema),
};
