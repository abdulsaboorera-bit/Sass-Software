"use strict";

/**
 * Clinic module models. One vertical, self-contained: departments, doctors
 * (with salary + commission), patients, appointments, prescriptions, medical
 * records, a laboratory (tests + results), clinical billing, an integrated
 * pharmacy (categories, medicines, suppliers, stock movements, sales,
 * payments), operating expenses, payroll (salaries), doctor attendance, and
 * clinic settings.
 */

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

// ── Departments ──────────────────────────────────────────
const departmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    location: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// ── Doctors ──────────────────────────────────────────────
const doctorSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    qualification: { type: String },
    experience: { type: Number, default: 0, min: 0 },
    fee: { type: Number, required: true, min: 0 },
    salary: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    departmentId: { ...ref("Department"), default: null, index: true },
    availableDays: { type: [String], default: [] },
    availableTime: { type: String },
    joinDate: { type: Date, default: Date.now },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
doctorSchema.index({ tenantId: 1, name: 1 });
doctorSchema.virtual("department", { ref: "Department", localField: "departmentId", foreignField: "_id", justOne: true });

// ── Patients ─────────────────────────────────────────────
const patientSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientNo: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String },
    address: { type: String },
    cnic: { type: String },
    allergies: { type: String },
    medicalHistory: { type: String },
    emergencyContact: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
patientSchema.index({ tenantId: 1, patientNo: 1 }, { unique: true });
patientSchema.index({ tenantId: 1, name: 1 });
patientSchema.index({ tenantId: 1, phone: 1 });

// ── Appointments ─────────────────────────────────────────
const appointmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    doctorId: { ...ref("Doctor"), required: true, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    duration: { type: Number, default: 30 },
    reason: { type: String },
    fee: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
      index: true,
    },
    paymentStatus: { type: String, enum: ["UNPAID", "PAID"], default: "UNPAID" },
    notes: { type: String },
  },
  baseOptions
);
appointmentSchema.index({ tenantId: 1, date: 1, time: 1 });
appointmentSchema.index({ tenantId: 1, patientId: 1, date: -1 });
appointmentSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
appointmentSchema.virtual("doctor", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

// ── Prescriptions ────────────────────────────────────────
const prescriptionSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    doctorId: { ...ref("Doctor"), required: true, index: true },
    appointmentId: { ...ref("Appointment"), default: null },
    diagnosis: { type: String, required: true },
    medications: { type: Schema.Types.Mixed, default: [] }, // [{ name, dosage, frequency, duration, instructions }]
    advice: { type: String },
    followUpDate: { type: Date },
    status: { type: String, enum: ["ISSUED", "DISPENSED", "CANCELLED"], default: "ISSUED", index: true },
    notes: { type: String },
  },
  baseOptions
);
prescriptionSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
prescriptionSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
prescriptionSchema.virtual("doctor", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

// ── Medical records ──────────────────────────────────────
const medicalRecordSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    type: { type: String, required: true }, // CONSULTATION, LAB, IMAGING, SURGERY, VACCINATION, OTHER
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    recordedAt: { type: Date, default: Date.now },
  },
  baseOptions
);
medicalRecordSchema.index({ tenantId: 1, patientId: 1, recordedAt: -1 });
medicalRecordSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });

// ── Laboratory ───────────────────────────────────────────
const labTestSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String },
    category: { type: String },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String },
    referenceRange: { type: String },
    turnaroundHours: { type: Number, default: 24, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
labTestSchema.index({ tenantId: 1, name: 1 });

const labResultSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    testId: { ...ref("LabTest"), default: null, index: true },
    doctorId: { ...ref("Doctor"), default: null },
    testName: { type: String, required: true },
    date: { type: Date, default: Date.now, index: true },
    result: { type: Schema.Types.Mixed }, // value or { values: [...] }
    notes: { type: String },
    status: { type: String, enum: ["PENDING", "COMPLETED"], default: "COMPLETED", index: true },
  },
  baseOptions
);
labResultSchema.index({ tenantId: 1, patientId: 1, date: -1 });
labResultSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
labResultSchema.virtual("test", { ref: "LabTest", localField: "testId", foreignField: "_id", justOne: true });
labResultSchema.virtual("doctor", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

// ── Clinical billing ─────────────────────────────────────
const invoiceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    appointmentId: { ...ref("Appointment"), default: null },
    invoiceRef: { type: String, required: true },
    type: { type: String, enum: ["CONSULTATION", "PROCEDURE", "LAB", "PHARMACY", "SERVICE", "OTHER"], default: "CONSULTATION" },
    items: { type: Schema.Types.Mixed, default: [] }, // optional line items
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    status: { type: String, enum: ["PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"], default: "PENDING", index: true },
    notes: { type: String },
  },
  baseOptions
);
invoiceSchema.index({ tenantId: 1, invoiceRef: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
invoiceSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
invoiceSchema.virtual("balance").get(function () {
  return Math.max(0, Number(this.amount) - Number(this.paidAmount || 0));
});

const paymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true, index: true },
    invoiceId: { ...ref("ClinicInvoice"), default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, default: "CONSULTATION" },
    method: { type: String, enum: METHODS, required: true },
    reference: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  baseOptions
);
paymentSchema.index({ tenantId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, patientId: 1, paidAt: -1 });
paymentSchema.index({ tenantId: 1, invoiceId: 1, paidAt: -1 });
paymentSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });

// ── Pharmacy ─────────────────────────────────────────────
const medicineCategorySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
medicineCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const medicineSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    categoryId: { ...ref("MedicineCategory"), default: null, index: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    brand: { type: String },
    strength: { type: String },
    form: { type: String, enum: ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "DROPS", "INHALER", "OTHER"], default: "TABLET" },
    sku: { type: String, trim: true },
    barcode: { type: String },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger, default: 0 },
    unit: { type: String, default: "pcs" },
    minStock: { type: Number, min: 0, validate: Number.isInteger, default: 10 },
    costPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    supplierId: { ...ref("PharmacySupplier"), default: null },
    supplierName: { type: String },
    manufacturer: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
medicineSchema.index({ tenantId: 1, name: 1 });
medicineSchema.index({ tenantId: 1, categoryId: 1 });
medicineSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
medicineSchema.virtual("category", { ref: "MedicineCategory", localField: "categoryId", foreignField: "_id", justOne: true });

const stockMovementSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    medicineId: { ...ref("Medicine"), required: true, index: true },
    type: { type: String, enum: ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "DAMAGED", "EXPIRED"], required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    reference: { type: String },
    notes: { type: String },
    createdBy: { ...ref("User") },
  },
  baseOptions
);
stockMovementSchema.index({ tenantId: 1, medicineId: 1, createdAt: -1 });
stockMovementSchema.virtual("medicine", { ref: "Medicine", localField: "medicineId", foreignField: "_id", justOne: true });

const supplierSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    contactPerson: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
supplierSchema.index({ tenantId: 1, name: 1 });

const saleItemSchema = new Schema(
  {
    medicineId: { ...ref("Medicine"), required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    saleRef: { type: String, required: true },
    patientId: { ...ref("Patient"), default: null, index: true },
    prescriptionId: { ...ref("Prescription"), default: null },
    customerName: { type: String },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["PENDING", "PARTIAL", "PAID", "CANCELLED"], default: "PAID", index: true },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    soldAt: { type: Date, default: Date.now, index: true },
    soldBy: { ...ref("User") },
    notes: { type: String },
  },
  baseOptions
);
saleSchema.index({ tenantId: 1, saleRef: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, soldAt: -1 });
saleSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });

const pharmacyPaymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    saleId: { ...ref("PharmacySale"), required: true, index: true },
    patientId: { ...ref("Patient"), default: null },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: METHODS, required: true },
    reference: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  baseOptions
);
pharmacyPaymentSchema.index({ tenantId: 1, paidAt: -1 });

// ── Expenses ─────────────────────────────────────────────
const expenseSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    category: {
      type: String,
      enum: ["RENT", "UTILITIES", "SALARY", "COMMISSION", "MAINTENANCE", "MARKETING", "SUPPLIES", "EQUIPMENT", "MEDICINES", "INSURANCE", "OTHER"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: METHODS, default: "CASH" },
    reference: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], default: "APPROVED" },
    notes: { type: String },
  },
  baseOptions
);
expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });

// ── Payroll (doctor salaries) ────────────────────────────
const salarySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    doctorId: { ...ref("Doctor"), required: true, index: true },
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
salarySchema.index({ tenantId: 1, doctorId: 1, month: 1 }, { unique: true });
salarySchema.index({ tenantId: 1, month: 1 });
salarySchema.virtual("staff", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

// ── Doctor attendance ────────────────────────────────────
const attendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    doctorId: { ...ref("Doctor"), required: true, index: true },
    date: { type: Date, required: true },
    dayKey: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE", "HALF_DAY"], default: "PRESENT" },
    checkIn: { type: String },
    checkOut: { type: String },
    notes: { type: String },
  },
  baseOptions
);
attendanceSchema.index({ tenantId: 1, doctorId: 1, dayKey: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, dayKey: 1 });
attendanceSchema.virtual("staff", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

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
    clinicName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    registrationNo: { type: String },
    operatingHours: [operatingHoursSchema],
    defaultConsultationFee: { type: Number, default: 0, min: 0 },
    defaultCommissionRate: { type: Number, default: 0, min: 0, max: 100 },
    defaultAppointmentDuration: { type: Number, default: 30 },
    lowStockThreshold: { type: Number, default: 10 },
  },
  baseOptions
);

module.exports = {
  Department: mongoose.models.Department || mongoose.model("Department", departmentSchema),
  Doctor: mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema),
  Patient: mongoose.models.Patient || mongoose.model("Patient", patientSchema),
  Appointment: mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema),
  Prescription: mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema),
  MedicalRecord: mongoose.models.MedicalRecord || mongoose.model("MedicalRecord", medicalRecordSchema),
  LabTest: mongoose.models.LabTest || mongoose.model("LabTest", labTestSchema),
  LabResult: mongoose.models.LabResult || mongoose.model("LabResult", labResultSchema),
  ClinicInvoice: mongoose.models.ClinicInvoice || mongoose.model("ClinicInvoice", invoiceSchema),
  ClinicPayment: mongoose.models.ClinicPayment || mongoose.model("ClinicPayment", paymentSchema),
  MedicineCategory: mongoose.models.MedicineCategory || mongoose.model("MedicineCategory", medicineCategorySchema),
  Medicine: mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema),
  PharmacySupplier: mongoose.models.PharmacySupplier || mongoose.model("PharmacySupplier", supplierSchema),
  PharmacyStockMovement: mongoose.models.PharmacyStockMovement || mongoose.model("PharmacyStockMovement", stockMovementSchema),
  PharmacySale: mongoose.models.PharmacySale || mongoose.model("PharmacySale", saleSchema),
  PharmacyPayment: mongoose.models.PharmacyPayment || mongoose.model("PharmacyPayment", pharmacyPaymentSchema),
  ClinicExpense: mongoose.models.ClinicExpense || mongoose.model("ClinicExpense", expenseSchema),
  ClinicSalary: mongoose.models.ClinicSalary || mongoose.model("ClinicSalary", salarySchema),
  ClinicAttendance: mongoose.models.ClinicAttendance || mongoose.model("ClinicAttendance", attendanceSchema),
  ClinicSettings: mongoose.models.ClinicSettings || mongoose.model("ClinicSettings", settingsSchema),
};
