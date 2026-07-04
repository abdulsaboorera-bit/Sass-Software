"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

const departmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  baseOptions
);
departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const doctorSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    qualification: { type: String },
    experience: { type: Number },
    fee: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    departmentId: { ...ref("Department"), default: null },
  },
  baseOptions
);

const patientSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientNo: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    address: { type: String },
    bloodGroup: { type: String },
    allergies: { type: String },
    cnic: { type: String },
    photo: { type: String },
  },
  baseOptions
);
patientSchema.index({ tenantId: 1, patientNo: 1 }, { unique: true });

const appointmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true },
    doctorId: { ...ref("Doctor"), required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, default: "SCHEDULED" },
    reason: { type: String },
    notes: { type: String },
  },
  baseOptions
);
appointmentSchema.index({ tenantId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

const prescriptionSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true },
    doctorId: { ...ref("Doctor"), required: true },
    diagnosis: { type: String, required: true },
    medications: { type: Schema.Types.Mixed, required: true },
    notes: { type: String },
    followUpDate: { type: Date },
  },
  baseOptions
);
prescriptionSchema.index({ tenantId: 1, patientId: 1 });

const medicalRecordSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
  },
  baseOptions
);
medicalRecordSchema.index({ tenantId: 1, patientId: 1 });

const clinicInvoiceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    patientId: { ...ref("Patient"), required: true },
    invoiceNo: { type: String, required: true },
    items: { type: Schema.Types.Mixed, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"], default: "PENDING" },
    paidAt: { type: Date },
  },
  baseOptions
);
clinicInvoiceSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true });

const clinicPaymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    invoiceId: { ...ref("ClinicInvoice"), required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"], required: true },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String },
  },
  baseOptions
);

// Relation aliases the frontend reads (appointment.patient/.doctor, doctor.department).
doctorSchema.virtual("department", { ref: "Department", localField: "departmentId", foreignField: "_id", justOne: true });
appointmentSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
appointmentSchema.virtual("doctor", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });
clinicInvoiceSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
prescriptionSchema.virtual("patient", { ref: "Patient", localField: "patientId", foreignField: "_id", justOne: true });
prescriptionSchema.virtual("doctor", { ref: "Doctor", localField: "doctorId", foreignField: "_id", justOne: true });

module.exports = {
  Department: mongoose.models.Department || mongoose.model("Department", departmentSchema),
  Doctor: mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema),
  Patient: mongoose.models.Patient || mongoose.model("Patient", patientSchema),
  Appointment: mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema),
  Prescription: mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema),
  MedicalRecord: mongoose.models.MedicalRecord || mongoose.model("MedicalRecord", medicalRecordSchema),
  ClinicInvoice: mongoose.models.ClinicInvoice || mongoose.model("ClinicInvoice", clinicInvoiceSchema),
  ClinicPayment: mongoose.models.ClinicPayment || mongoose.model("ClinicPayment", clinicPaymentSchema),
};
