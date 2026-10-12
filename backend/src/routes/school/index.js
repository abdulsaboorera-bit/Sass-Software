"use strict";

const express = require("express");
const { requireAuth, requireTenant, requireIndustry } = require("../../middleware/auth");
const { makeCrudRouter, sanitize } = require("../../utils/crud");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const {
  SchoolSettings,
  Teacher,
  SchoolClass,
  Subject,
  Student,
  Attendance,
  TeacherAttendance,
  Timetable,
  Exam,
  ExamSubject,
  ExamResult,
  Assignment,
  AssignmentSubmission,
  FeeStructure,
  SchoolExpense,
  LibraryBook,
  LibraryIssue,
  TransportRoute,
  TransportAssignment,
  Hostel,
  HostelRoom,
  HostelAllocation,
  Notice,
  SchoolEvent,
  Admission,
} = require("../../models");

const attendanceCtrl = require("../../controllers/school/attendance.controller");
const billingCtrl = require("../../controllers/school/billing.controller");
const payrollCtrl = require("../../controllers/school/payroll.controller");
const examCtrl = require("../../controllers/school/exam.controller");
const analyticsCtrl = require("../../controllers/school/analytics.controller");

const router = express.Router();

// Everything in the school module requires an authenticated user operating
// inside a tenant whose industry is SCHOOL.
router.use(requireAuth, requireTenant, requireIndustry("SCHOOL"));

const validateReference = (model, field, label) => async (payload, req) => {
  if (payload[field] && !(await model.exists({ _id: payload[field], tenantId: req.tenantId }))) throw ApiError.badRequest(`Invalid ${label}`);
  return payload;
};

// ── Classes (list not paginated; adds _count.students) ───
router.use(
  "/classes",
  makeCrudRouter({
    model: SchoolClass,
    permission: "classes",
    listKey: "classes",
    itemKey: "schoolClass",
    paginated: false,
    searchFields: ["name", "section", "roomNo"],
    filterFields: ["isActive", "teacherId"],
    sort: { name: 1, section: 1 },
    beforeCreate: validateReference(Teacher, "teacherId", "teacher"),
    beforeUpdate: validateReference(Teacher, "teacherId", "teacher"),
    async decorateRows(rows) {
      const counts = await Student.aggregate([
        { $match: { classId: { $in: rows.map((r) => r._id) } } },
        { $group: { _id: "$classId", n: { $sum: 1 } } },
      ]);
      const map = new Map(counts.map((c) => [String(c._id), c.n]));
      return rows.map((r) => ({ ...r, _count: { students: map.get(String(r._id)) || 0 } }));
    },
  })
);

// ── Students ─────────────────────────────────────────────
router.use(
  "/students",
  makeCrudRouter({
    model: Student,
    permission: "students",
    listKey: "students",
    itemKey: "student",
    searchFields: ["name", "admissionNo", "fatherName", "phone", "guardianName"],
    filterFields: ["classId", "status", "gender", "transportRouteId", "hostelRoomId"],
    populate: [{ path: "class", select: "name section" }],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      if (!payload.admissionNo) {
        const count = await Student.countDocuments({ tenantId: req.tenantId });
        payload.admissionNo = `ADM-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Teachers ─────────────────────────────────────────────
router.use(
  "/teachers",
  makeCrudRouter({
    model: Teacher,
    permission: "teachers",
    listKey: "teachers",
    itemKey: "teacher",
    searchFields: ["name", "employeeNo", "phone", "email", "designation"],
    filterFields: ["isActive", "gender", "designation"],
    sort: { name: 1 },
    beforeCreate: async (payload, req) => {
      if (!payload.employeeNo) {
        const count = await Teacher.countDocuments({ tenantId: req.tenantId });
        payload.employeeNo = `EMP-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Subjects ─────────────────────────────────────────────
router.use(
  "/subjects",
  makeCrudRouter({
    model: Subject,
    permission: "subjects",
    listKey: "subjects",
    itemKey: "subject",
    searchFields: ["name", "code"],
    filterFields: ["classId", "teacherId", "isActive"],
    populate: [
      { path: "teacher", select: "name" },
      { path: "class", select: "name section" },
    ],
    sort: { name: 1 },
    beforeCreate: async (payload, req) => {
      await validateReference(SchoolClass, "classId", "class")(payload, req);
      await validateReference(Teacher, "teacherId", "teacher")(payload, req);
      return payload;
    },
    beforeUpdate: validateReference(Teacher, "teacherId", "teacher"),
  })
);

// ── Timetable ────────────────────────────────────────────
router.use(
  "/timetable",
  makeCrudRouter({
    model: Timetable,
    permission: "timetable",
    listKey: "timetable",
    itemKey: "period",
    paginated: false,
    filterFields: ["classId", "teacherId", "dayOfWeek"],
    sort: { dayOfWeek: 1, startTime: 1 },
    beforeCreate: async (payload, req) => {
      await validateReference(SchoolClass, "classId", "class")(payload, req);
      await validateReference(Teacher, "teacherId", "teacher")(payload, req);
      await validateReference(Subject, "subjectId", "subject")(payload, req);
      return payload;
    },
    beforeUpdate: async (payload, req) => {
      await validateReference(Subject, "subjectId", "subject")(payload, req);
      await validateReference(Teacher, "teacherId", "teacher")(payload, req);
      return payload;
    },
  })
);

// ── Assignments (homework) + submissions ─────────────────
router.use(
  "/submissions",
  makeCrudRouter({
    model: AssignmentSubmission,
    permission: "assignments",
    listKey: "submissions",
    itemKey: "submission",
    filterFields: ["assignmentId", "studentId", "status"],
    populate: [
      { path: "student", select: "name admissionNo" },
      { path: "assignment", select: "title dueDate" },
    ],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(Assignment, "assignmentId", "assignment")(payload, req);
      await validateReference(Student, "studentId", "student")(payload, req);
      return payload;
    },
  })
);

router.use(
  "/assignments",
  makeCrudRouter({
    model: Assignment,
    permission: "assignments",
    listKey: "assignments",
    itemKey: "assignment",
    searchFields: ["title", "description"],
    filterFields: ["classId", "subjectId", "teacherId"],
    populate: [
      { path: "class", select: "name section" },
      { path: "subject", select: "name" },
    ],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(SchoolClass, "classId", "class")(payload, req);
      await validateReference(Subject, "subjectId", "subject")(payload, req);
      await validateReference(Teacher, "teacherId", "teacher")(payload, req);
      return payload;
    },
  })
);

// ── Admissions ───────────────────────────────────────────
router.use(
  "/admissions",
  makeCrudRouter({
    model: Admission,
    permission: "admissions",
    listKey: "admissions",
    itemKey: "admission",
    searchFields: ["applicantName", "guardianName", "phone", "email"],
    filterFields: ["status", "classAppliedId"],
    populate: [{ path: "classApplied", select: "name section" }],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(SchoolClass, "classAppliedId", "class")(payload, req);
      if (!payload.applicationNo) {
        const count = await Admission.countDocuments({ tenantId: req.tenantId });
        payload.applicationNo = `APP-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Fee structures ───────────────────────────────────────
router.use(
  "/fee-structures",
  makeCrudRouter({
    model: FeeStructure,
    permission: "fees",
    listKey: "feeStructures",
    itemKey: "feeStructure",
    filterFields: ["classId", "isActive", "frequency"],
    populate: [{ path: "class", select: "name section" }],
    sort: { createdAt: -1 },
    beforeCreate: validateReference(SchoolClass, "classId", "class"),
    beforeUpdate: validateReference(SchoolClass, "classId", "class"),
  })
);

// ── Fees (vouchers + collection) ─────────────────────────
router.get("/fees/summary", requirePermission("fees.view"), billingCtrl.summary);
router.post("/fees/generate", requirePermission("fees.create"), billingCtrl.generate);
router.post("/fees/mark-overdue", requirePermission("fees.edit"), billingCtrl.markOverdue);
router.post("/fees/vouchers", requirePermission("fees.create"), billingCtrl.createVoucher);
router.post("/fees/:id/pay", requirePermission("fees.collect"), billingCtrl.pay);
router.post("/fees/:id/cancel", requirePermission("fees.edit"), billingCtrl.cancel);
router.get("/fees", requirePermission("fees.view"), billingCtrl.list);
router.post("/fees", requireAnyPermission("fees.collect", "fees.create"), billingCtrl.create);
router.patch("/fees/:id", requirePermission("fees.edit"), billingCtrl.update);
router.patch("/fees", requirePermission("fees.edit"), billingCtrl.update);
router.delete("/fees/:id", requirePermission("fees.edit"), billingCtrl.remove);
router.delete("/fees", requirePermission("fees.edit"), billingCtrl.remove);

// ── Exams, subjects & marks ──────────────────────────────
router.post("/exams/marks", requirePermission("exams.marks"), examCtrl.saveMarks);
router.get("/exams/report-card", requirePermission("exams.view"), examCtrl.reportCard);
router.get("/exams/result-sheet", requirePermission("exams.view"), examCtrl.resultSheet);

router.use(
  "/exam-subjects",
  makeCrudRouter({
    model: ExamSubject,
    permission: "exams",
    listKey: "examSubjects",
    itemKey: "examSubject",
    filterFields: ["examId", "subjectId"],
    populate: [
      { path: "subject", select: "name" },
      { path: "exam", select: "name" },
    ],
    sort: { createdAt: 1 },
    beforeCreate: async (payload, req) => {
      await validateReference(Exam, "examId", "exam")(payload, req);
      await validateReference(Subject, "subjectId", "subject")(payload, req);
      return payload;
    },
  })
);

router.use(
  "/exam-results",
  makeCrudRouter({
    model: ExamResult,
    permission: "exams",
    listKey: "results",
    itemKey: "result",
    filterFields: ["studentId", "examId", "examName", "subjectId"],
    perms: { create: "exams.marks", edit: "exams.marks", remove: "exams.marks" },
    populate: [
      { path: "student", select: "name admissionNo" },
      { path: "subjectRef", select: "name" },
    ],
    sort: { createdAt: -1 },
  })
);

router.use(
  "/exams",
  makeCrudRouter({
    model: Exam,
    permission: "exams",
    listKey: "exams",
    itemKey: "exam",
    searchFields: ["name", "term"],
    filterFields: ["classId", "term", "status"],
    populate: [{ path: "class", select: "name section" }],
    sort: { startDate: -1 },
    beforeCreate: validateReference(SchoolClass, "classId", "class"),
    beforeUpdate: validateReference(SchoolClass, "classId", "class"),
  })
);

// ── Attendance (students) ────────────────────────────────
router.get("/attendance", requirePermission("attendance.view"), attendanceCtrl.list);
router.post("/attendance", requireAnyPermission("attendance.mark", "attendance.create"), attendanceCtrl.mark);

// ── Teacher attendance ───────────────────────────────────
router.use(
  "/teacher-attendance",
  makeCrudRouter({
    model: TeacherAttendance,
    permission: "staff-attendance",
    listKey: "attendance",
    itemKey: "attendance",
    filterFields: ["teacherId", "status", "dayKey"],
    populate: [{ path: "staff", select: "name designation" }],
    sort: { date: -1 },
    beforeCreate: validateReference(Teacher, "teacherId", "teacher"),
  })
);

// ── Expenses ─────────────────────────────────────────────
router.use(
  "/expenses",
  makeCrudRouter({
    model: SchoolExpense,
    permission: "expenses",
    listKey: "expenses",
    itemKey: "expense",
    searchFields: ["description", "reference"],
    filterFields: ["category", "status"],
    sort: { date: -1 },
  })
);

// ── Salaries (payroll) ───────────────────────────────────
router.get("/salaries/summary", requirePermission("salaries.view"), payrollCtrl.summary);
router.post("/salaries/generate", requirePermission("salaries.create"), payrollCtrl.generate);
router.post("/salaries/:id/pay", requirePermission("salaries.edit"), payrollCtrl.markPaid);
router.get("/salaries", requirePermission("salaries.view"), payrollCtrl.list);
router.get("/salaries/:id", requirePermission("salaries.view"), payrollCtrl.getOne);
router.patch("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.update);
router.patch("/salaries", requirePermission("salaries.edit"), payrollCtrl.update);
router.delete("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.remove);
router.delete("/salaries", requirePermission("salaries.edit"), payrollCtrl.remove);

// ── Library ──────────────────────────────────────────────
router.use(
  "/library/books",
  makeCrudRouter({
    model: LibraryBook,
    permission: "library",
    listKey: "books",
    itemKey: "book",
    searchFields: ["title", "author", "isbn", "category"],
    filterFields: ["category", "isActive"],
    sort: { title: 1 },
  })
);

router.use(
  "/library/issues",
  makeCrudRouter({
    model: LibraryIssue,
    permission: "library",
    listKey: "issues",
    itemKey: "issue",
    filterFields: ["bookId", "studentId", "teacherId", "status"],
    populate: [
      { path: "book", select: "title author" },
      { path: "student", select: "name admissionNo" },
      { path: "teacher", select: "name" },
    ],
    sort: { issuedAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(LibraryBook, "bookId", "book")(payload, req);
      await validateReference(Student, "studentId", "student")(payload, req);
      await validateReference(Teacher, "teacherId", "teacher")(payload, req);
      return payload;
    },
  })
);

// ── Transport ────────────────────────────────────────────
router.use(
  "/transport/routes",
  makeCrudRouter({
    model: TransportRoute,
    permission: "transport",
    listKey: "routes",
    itemKey: "route",
    paginated: false,
    searchFields: ["name", "driverName", "vehicleNo"],
    filterFields: ["isActive"],
    sort: { name: 1 },
  })
);

router.use(
  "/transport/assignments",
  makeCrudRouter({
    model: TransportAssignment,
    permission: "transport",
    listKey: "assignments",
    itemKey: "assignment",
    filterFields: ["routeId", "studentId", "status"],
    populate: [
      { path: "route", select: "name vehicleNo" },
      { path: "student", select: "name admissionNo" },
    ],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(TransportRoute, "routeId", "route")(payload, req);
      await validateReference(Student, "studentId", "student")(payload, req);
      return payload;
    },
  })
);

// ── Hostel ───────────────────────────────────────────────
router.use(
  "/hostels/rooms",
  makeCrudRouter({
    model: HostelRoom,
    permission: "hostel",
    listKey: "rooms",
    itemKey: "room",
    filterFields: ["hostelId", "isActive"],
    populate: [{ path: "hostel", select: "name" }],
    sort: { roomNo: 1 },
    beforeCreate: validateReference(Hostel, "hostelId", "hostel"),
  })
);

router.use(
  "/hostel-allocations",
  makeCrudRouter({
    model: HostelAllocation,
    permission: "hostel",
    listKey: "allocations",
    itemKey: "allocation",
    filterFields: ["roomId", "studentId", "status"],
    populate: [
      { path: "room", select: "roomNo" },
      { path: "student", select: "name admissionNo" },
    ],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(HostelRoom, "roomId", "room")(payload, req);
      await validateReference(Student, "studentId", "student")(payload, req);
      return payload;
    },
  })
);

router.use(
  "/hostels",
  makeCrudRouter({
    model: Hostel,
    permission: "hostel",
    listKey: "hostels",
    itemKey: "hostel",
    paginated: false,
    searchFields: ["name", "wardenName"],
    filterFields: ["isActive"],
    sort: { name: 1 },
  })
);

// ── Notices & events ─────────────────────────────────────
router.use(
  "/notices",
  makeCrudRouter({
    model: Notice,
    permission: "notices",
    listKey: "notices",
    itemKey: "notice",
    searchFields: ["title", "body"],
    filterFields: ["audience", "isPinned"],
    sort: { isPinned: -1, publishedAt: -1 },
  })
);

router.use(
  "/events",
  makeCrudRouter({
    model: SchoolEvent,
    permission: "events",
    listKey: "events",
    itemKey: "event",
    searchFields: ["title", "description", "location"],
    filterFields: ["type"],
    sort: { startDate: -1 },
  })
);

// ── Analytics / reports ──────────────────────────────────
const canView = requireAnyPermission("analytics.view", "fees.view", "students.view");
router.get("/analytics/dashboard", canView, analyticsCtrl.dashboard);
router.get("/analytics/students", canView, analyticsCtrl.students);
router.get("/analytics/attendance", canView, analyticsCtrl.attendance);
router.get("/analytics/attendance-trend", canView, analyticsCtrl.attendanceTrend);
router.get("/attendance/trends", canView, analyticsCtrl.attendanceTrend);
router.get("/analytics/fees", canView, analyticsCtrl.fees);
router.get("/analytics/revenue", canView, analyticsCtrl.revenue);
router.get("/analytics/expenses", canView, analyticsCtrl.expenses);
router.get("/analytics/payroll", canView, analyticsCtrl.payroll);
router.get("/analytics/admissions", canView, analyticsCtrl.admissions);
router.get("/analytics/library", canView, analyticsCtrl.library);
router.get("/analytics/low-attendance", canView, analyticsCtrl.lowAttendance);
router.get("/analytics/upcoming-events", canView, analyticsCtrl.upcomingEvents);
router.get("/analytics/notices", canView, analyticsCtrl.notices);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await SchoolSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await SchoolSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;
