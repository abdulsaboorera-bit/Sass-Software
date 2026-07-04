"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

const schoolClassSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    section: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    feeAmount: { type: Number },
  },
  baseOptions
);
schoolClassSchema.index({ tenantId: 1, name: 1, section: 1 }, { unique: true });

const studentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    admissionNo: { type: String, required: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    fatherName: { type: String, required: true },
    fatherPhone: { type: String, required: true },
    motherPhone: { type: String },
    address: { type: String },
    photo: { type: String },
    email: { type: String },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    status: { type: String, default: "ACTIVE" },
    admissionDate: { type: Date, default: Date.now },
  },
  baseOptions
);
studentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true });

const attendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true },
    remarks: { type: String },
  },
  baseOptions
);
attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });

const feePaymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"], default: "PENDING" },
    paidAt: { type: Date },
    method: { type: String, enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"] },
    receiptNo: { type: String },
    remarks: { type: String },
  },
  baseOptions
);
feePaymentSchema.index({ tenantId: 1, month: 1, year: 1 });

const examResultSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    examName: { type: String, required: true },
    subject: { type: String, required: true },
    marks: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
    examDate: { type: Date, required: true },
  },
  baseOptions
);
examResultSchema.index({ tenantId: 1, examName: 1 });

// Relation aliases the frontend reads (student.class, payment.student, ...).
studentSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });
attendanceSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
feePaymentSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
examResultSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });

module.exports = {
  SchoolClass: mongoose.models.SchoolClass || mongoose.model("SchoolClass", schoolClassSchema),
  Student: mongoose.models.Student || mongoose.model("Student", studentSchema),
  Attendance: mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema),
  FeePayment: mongoose.models.FeePayment || mongoose.model("FeePayment", feePaymentSchema),
  ExamResult: mongoose.models.ExamResult || mongoose.model("ExamResult", examResultSchema),
};
