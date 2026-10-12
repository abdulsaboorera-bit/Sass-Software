"use strict";

/**
 * School module models. One vertical, self-contained: settings, teachers,
 * classes, subjects, students, student + teacher attendance, timetable,
 * exams (with subjects and results), homework/assignments, a fee system
 * (structures + vouchers/payments), operating expenses, payroll (salaries),
 * a library, transport, hostel, notices, events and admissions.
 */

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });
const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"];

// ── Settings ─────────────────────────────────────────────
const gradeBandSchema = new Schema(
  {
    grade: { type: String, required: true },
    minPercent: { type: Number, required: true, min: 0, max: 100 },
    maxPercent: { type: Number, required: true, min: 0, max: 100 },
    remarks: { type: String },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, unique: true, index: true },
    schoolName: { type: String, trim: true },
    tagline: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    principalName: { type: String },
    registrationNo: { type: String },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    academicYear: { type: String, default: "2025-2026" },
    currentTerm: { type: String, enum: ["TERM_1", "TERM_2", "TERM_3", "ANNUAL"], default: "TERM_1" },
    passingPercent: { type: Number, default: 40, min: 0, max: 100 },
    lowAttendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
    feeDueDay: { type: Number, default: 10, min: 1, max: 31 },
    gradingScale: { type: [gradeBandSchema], default: [] },
  },
  baseOptions
);

// ── Teachers ─────────────────────────────────────────────
const teacherSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    employeeNo: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    cnic: { type: String },
    designation: { type: String, default: "Teacher" },
    specialization: { type: String },
    qualification: { type: String },
    salary: { type: Number, default: 0, min: 0 },
    joinDate: { type: Date, default: Date.now },
    address: { type: String },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
teacherSchema.index({ tenantId: 1, employeeNo: 1 }, { unique: true });
teacherSchema.index({ tenantId: 1, name: 1 });

// ── Classes ──────────────────────────────────────────────
const schoolClassSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true },
    section: { type: String, required: true },
    teacherId: { ...ref("Teacher"), default: null, index: true },
    roomNo: { type: String },
    capacity: { type: Number, min: 0 },
    feeAmount: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
schoolClassSchema.index({ tenantId: 1, name: 1, section: 1 }, { unique: true });
schoolClassSchema.virtual("classTeacher", { ref: "Teacher", localField: "teacherId", foreignField: "_id", justOne: true });

// ── Subjects ─────────────────────────────────────────────
const subjectSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String },
    teacherId: { ...ref("Teacher"), default: null, index: true },
    totalMarks: { type: Number, default: 100, min: 1 },
    passingMarks: { type: Number, default: 40, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
subjectSchema.index({ tenantId: 1, classId: 1, name: 1 }, { unique: true });
subjectSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });
subjectSchema.virtual("teacher", { ref: "Teacher", localField: "teacherId", foreignField: "_id", justOne: true });

// ── Students ─────────────────────────────────────────────
const studentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    admissionNo: { type: String, required: true },
    rollNo: { type: String },
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    bloodGroup: { type: String },
    fatherName: { type: String, required: true },
    fatherPhone: { type: String, required: true },
    motherName: { type: String },
    motherPhone: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
    address: { type: String },
    city: { type: String },
    photo: { type: String },
    email: { type: String },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    section: { type: String },
    transportRouteId: { ...ref("TransportRoute"), default: null },
    hostelRoomId: { ...ref("HostelRoom"), default: null },
    previousSchool: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED"],
      default: "ACTIVE",
    },
    admissionDate: { type: Date, default: Date.now },
  },
  baseOptions
);
studentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, name: 1 });
studentSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });

// ── Student attendance ───────────────────────────────────
const attendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true },
    date: { type: Date, required: true },
    dayKey: { type: String },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true },
    remarks: { type: String },
  },
  baseOptions
);
attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });
attendanceSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });

// ── Teacher attendance ───────────────────────────────────
const teacherAttendanceSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    teacherId: { ...ref("Teacher"), required: true, index: true },
    date: { type: Date, required: true },
    dayKey: { type: String, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE", "HALF_DAY"], default: "PRESENT" },
    checkIn: { type: String },
    checkOut: { type: String },
    notes: { type: String },
  },
  baseOptions
);
teacherAttendanceSchema.index({ tenantId: 1, teacherId: 1, dayKey: 1 }, { unique: true });
teacherAttendanceSchema.index({ tenantId: 1, dayKey: 1 });
teacherAttendanceSchema.virtual("staff", { ref: "Teacher", localField: "teacherId", foreignField: "_id", justOne: true });

// ── Timetable ────────────────────────────────────────────
const periodSchema = new Schema(
  {
    period: { type: Number, required: true, min: 1 },
    subjectId: { ...ref("Subject"), default: null },
    teacherId: { ...ref("Teacher"), default: null },
    startTime: { type: String },
    endTime: { type: String },
    room: { type: String },
  },
  { _id: false }
);

const timetableSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    periods: { type: [periodSchema], default: [] },
  },
  baseOptions
);
timetableSchema.index({ tenantId: 1, classId: 1, dayOfWeek: 1 }, { unique: true });
timetableSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });

// ── Exams ────────────────────────────────────────────────
const examSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    term: { type: String, enum: ["TERM_1", "TERM_2", "TERM_3", "MIDTERM", "FINAL", "OTHER"], default: "TERM_1" },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"], default: "SCHEDULED", index: true },
    notes: { type: String },
  },
  baseOptions
);
examSchema.index({ tenantId: 1, classId: 1, name: 1 }, { unique: true });
examSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });

const examSubjectSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    examId: { ...ref("Exam"), required: true, index: true },
    subjectId: { ...ref("Subject"), required: true, index: true },
    date: { type: Date },
    startTime: { type: String },
    duration: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 100, min: 1 },
    passingMarks: { type: Number, default: 40, min: 0 },
  },
  baseOptions
);
examSubjectSchema.index({ tenantId: 1, examId: 1, subjectId: 1 }, { unique: true });
examSubjectSchema.virtual("subject", { ref: "Subject", localField: "subjectId", foreignField: "_id", justOne: true });
examSubjectSchema.virtual("exam", { ref: "Exam", localField: "examId", foreignField: "_id", justOne: true });

const examResultSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    examId: { ...ref("Exam"), default: null, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    subjectId: { ...ref("Subject"), default: null, index: true },
    // Retained for the simple/legacy exams page which posts free-text names.
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
examResultSchema.index({ tenantId: 1, examId: 1, studentId: 1, subjectId: 1 });
examResultSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
examResultSchema.virtual("subjectRef", { ref: "Subject", localField: "subjectId", foreignField: "_id", justOne: true });

// ── Assignments (homework) ───────────────────────────────
const assignmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    subjectId: { ...ref("Subject"), default: null, index: true },
    teacherId: { ...ref("Teacher"), default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date },
    maxMarks: { type: Number, default: 0, min: 0 },
    attachmentUrl: { type: String },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN", index: true },
  },
  baseOptions
);
assignmentSchema.index({ tenantId: 1, classId: 1, createdAt: -1 });
assignmentSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });
assignmentSchema.virtual("subject", { ref: "Subject", localField: "subjectId", foreignField: "_id", justOne: true });

const assignmentSubmissionSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    assignmentId: { ...ref("Assignment"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    submittedAt: { type: Date, default: Date.now },
    content: { type: String },
    attachmentUrl: { type: String },
    status: { type: String, enum: ["PENDING", "SUBMITTED", "GRADED", "LATE"], default: "SUBMITTED", index: true },
    marks: { type: Number, default: null, min: 0 },
    feedback: { type: String },
  },
  baseOptions
);
assignmentSubmissionSchema.index({ tenantId: 1, assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
assignmentSubmissionSchema.virtual("assignment", { ref: "Assignment", localField: "assignmentId", foreignField: "_id", justOne: true });

// ── Fee structures ───────────────────────────────────────
const feeItemSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const feeStructureSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    classId: { ...ref("SchoolClass"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["MONTHLY", "TERM", "ANNUAL", "ONE_TIME"], default: "MONTHLY" },
    amount: { type: Number, required: true, min: 0 },
    items: { type: [feeItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
feeStructureSchema.index({ tenantId: 1, classId: 1, name: 1 }, { unique: true });
feeStructureSchema.virtual("class", { ref: "SchoolClass", localField: "classId", foreignField: "_id", justOne: true });

// ── Fee vouchers / payments ──────────────────────────────
const feePaymentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    feeStructureId: { ...ref("FeeStructure"), default: null },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    dueDate: { type: Date },
    status: { type: String, enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"], default: "PENDING" },
    paidAt: { type: Date },
    method: { type: String, enum: METHODS },
    receiptNo: { type: String },
    remarks: { type: String },
  },
  baseOptions
);
feePaymentSchema.index({ tenantId: 1, month: 1, year: 1 });
feePaymentSchema.index({ tenantId: 1, studentId: 1, month: 1, year: 1 });
feePaymentSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });

// ── Expenses ─────────────────────────────────────────────
const expenseSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    category: {
      type: String,
      enum: ["RENT", "UTILITIES", "SALARY", "MAINTENANCE", "SUPPLIES", "TRANSPORT", "LIBRARY", "EVENTS", "MARKETING", "EQUIPMENT", "OTHER"],
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

// ── Payroll (teacher salaries) ───────────────────────────
const salarySchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    teacherId: { ...ref("Teacher"), required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    baseSalary: { type: Number, default: 0, min: 0 },
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
salarySchema.index({ tenantId: 1, teacherId: 1, month: 1 }, { unique: true });
salarySchema.index({ tenantId: 1, month: 1 });
salarySchema.virtual("staff", { ref: "Teacher", localField: "teacherId", foreignField: "_id", justOne: true });

// ── Library ──────────────────────────────────────────────
const libraryBookSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String },
    isbn: { type: String },
    category: { type: String },
    publisher: { type: String },
    edition: { type: String },
    shelf: { type: String },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
libraryBookSchema.index({ tenantId: 1, title: 1 });

const libraryIssueSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    bookId: { ...ref("LibraryBook"), required: true, index: true },
    studentId: { ...ref("Student"), default: null, index: true },
    teacherId: { ...ref("Teacher"), default: null, index: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    fine: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["ISSUED", "RETURNED", "OVERDUE", "LOST"], default: "ISSUED", index: true },
    notes: { type: String },
  },
  baseOptions
);
libraryIssueSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
libraryIssueSchema.virtual("book", { ref: "LibraryBook", localField: "bookId", foreignField: "_id", justOne: true });
libraryIssueSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
libraryIssueSchema.virtual("teacher", { ref: "Teacher", localField: "teacherId", foreignField: "_id", justOne: true });

// ── Transport ────────────────────────────────────────────
const stopSchema = new Schema(
  {
    name: { type: String, required: true },
    time: { type: String },
    fare: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const transportRouteSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    vehicleNo: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    conductorName: { type: String },
    capacity: { type: Number, default: 0, min: 0 },
    fare: { type: Number, default: 0, min: 0 },
    stops: { type: [stopSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
transportRouteSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const transportAssignmentSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    routeId: { ...ref("TransportRoute"), required: true, index: true },
    stopName: { type: String },
    fare: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  baseOptions
);
transportAssignmentSchema.index({ tenantId: 1, studentId: 1, routeId: 1 }, { unique: true });
transportAssignmentSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
transportAssignmentSchema.virtual("route", { ref: "TransportRoute", localField: "routeId", foreignField: "_id", justOne: true });

// ── Hostel ───────────────────────────────────────────────
const hostelSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["BOYS", "GIRLS", "MIXED"], default: "BOYS" },
    wardenName: { type: String },
    wardenPhone: { type: String },
    address: { type: String },
    capacity: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
hostelSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const hostelRoomSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    hostelId: { ...ref("Hostel"), required: true, index: true },
    roomNo: { type: String, required: true },
    floor: { type: String },
    capacity: { type: Number, default: 1, min: 1 },
    occupied: { type: Number, default: 0, min: 0 },
    fee: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);
hostelRoomSchema.index({ tenantId: 1, hostelId: 1, roomNo: 1 }, { unique: true });
hostelRoomSchema.virtual("hostel", { ref: "Hostel", localField: "hostelId", foreignField: "_id", justOne: true });

const hostelAllocationSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    studentId: { ...ref("Student"), required: true, index: true },
    roomId: { ...ref("HostelRoom"), required: true, index: true },
    allocatedAt: { type: Date, default: Date.now },
    vacatedAt: { type: Date, default: null },
    status: { type: String, enum: ["ACTIVE", "VACATED"], default: "ACTIVE" },
    notes: { type: String },
  },
  baseOptions
);
hostelAllocationSchema.index({ tenantId: 1, studentId: 1, status: 1 });
hostelAllocationSchema.virtual("student", { ref: "Student", localField: "studentId", foreignField: "_id", justOne: true });
hostelAllocationSchema.virtual("room", { ref: "HostelRoom", localField: "roomId", foreignField: "_id", justOne: true });

// ── Notices ──────────────────────────────────────────────
const noticeSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: { type: String, enum: ["ALL", "STUDENTS", "TEACHERS", "CLASS"], default: "ALL" },
    classId: { ...ref("SchoolClass"), default: null },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    createdBy: { ...ref("User") },
  },
  baseOptions
);
noticeSchema.index({ tenantId: 1, publishedAt: -1 });

// ── Events ───────────────────────────────────────────────
const eventSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ["ACADEMIC", "SPORTS", "CULTURAL", "HOLIDAY", "EXAM", "MEETING", "OTHER"], default: "OTHER" },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isHoliday: { type: Boolean, default: false },
  },
  baseOptions
);
eventSchema.index({ tenantId: 1, startDate: 1 });

// ── Admissions (enquiries / applications) ────────────────
const admissionSchema = new Schema(
  {
    tenantId: { ...ref("Tenant"), required: true, index: true },
    applicantName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    dateOfBirth: { type: Date },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String },
    previousSchool: { type: String },
    classAppliedId: { ...ref("SchoolClass"), default: null },
    address: { type: String },
    status: { type: String, enum: ["NEW", "CONTACTED", "INTERVIEW", "APPROVED", "REJECTED", "ADMITTED"], default: "NEW", index: true },
    source: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },
  },
  baseOptions
);
admissionSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
admissionSchema.virtual("classApplied", { ref: "SchoolClass", localField: "classAppliedId", foreignField: "_id", justOne: true });

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

module.exports = {
  SchoolSettings: model("SchoolSettings", settingsSchema),
  Teacher: model("Teacher", teacherSchema),
  SchoolClass: model("SchoolClass", schoolClassSchema),
  Subject: model("Subject", subjectSchema),
  Student: model("Student", studentSchema),
  Attendance: model("Attendance", attendanceSchema),
  TeacherAttendance: model("TeacherAttendance", teacherAttendanceSchema),
  Timetable: model("Timetable", timetableSchema),
  Exam: model("Exam", examSchema),
  ExamSubject: model("ExamSubject", examSubjectSchema),
  ExamResult: model("ExamResult", examResultSchema),
  Assignment: model("Assignment", assignmentSchema),
  AssignmentSubmission: model("AssignmentSubmission", assignmentSubmissionSchema),
  FeeStructure: model("FeeStructure", feeStructureSchema),
  FeePayment: model("FeePayment", feePaymentSchema),
  SchoolExpense: model("SchoolExpense", expenseSchema),
  SchoolSalary: model("SchoolSalary", salarySchema),
  LibraryBook: model("LibraryBook", libraryBookSchema),
  LibraryIssue: model("LibraryIssue", libraryIssueSchema),
  TransportRoute: model("TransportRoute", transportRouteSchema),
  TransportAssignment: model("TransportAssignment", transportAssignmentSchema),
  Hostel: model("Hostel", hostelSchema),
  HostelRoom: model("HostelRoom", hostelRoomSchema),
  HostelAllocation: model("HostelAllocation", hostelAllocationSchema),
  Notice: model("Notice", noticeSchema),
  SchoolEvent: model("SchoolEvent", eventSchema),
  Admission: model("Admission", admissionSchema),
};
