"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { makeCrudRouter } = require("../../utils/crud");
const { Student, SchoolClass, ExamResult } = require("../../models");
const attendanceCtrl = require("../../controllers/school/attendance.controller");
const feesCtrl = require("../../controllers/school/fees.controller");

const router = express.Router();
router.use(requireAuth, requireTenant);

// Classes — list not paginated, includes _count.students (frontend reads c._count.students).
router.use(
  "/classes",
  makeCrudRouter({
    model: SchoolClass,
    permission: "classes",
    listKey: "classes",
    itemKey: "schoolClass",
    paginated: false,
    searchFields: ["name", "section"],
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

router.use(
  "/students",
  makeCrudRouter({
    model: Student,
    permission: "students",
    listKey: "students",
    itemKey: "student",
    searchFields: ["name", "admissionNo", "fatherName"],
    filterFields: ["classId", "status"],
    populate: [{ path: "class", select: "name section" }],
  })
);

router.use(
  "/exams",
  makeCrudRouter({
    model: ExamResult,
    permission: "exams",
    listKey: "results",
    itemKey: "result",
    filterFields: ["studentId", "examName"],
    perms: { create: "exams.marks", edit: "exams.marks" },
    populate: [{ path: "student", select: "name admissionNo" }],
  })
);

// Attendance — bulk mark + list.
router.get("/attendance", requirePermission("attendance.view"), attendanceCtrl.list);
router.post("/attendance", requireAnyPermission("attendance.mark", "attendance.create"), attendanceCtrl.mark);

// Fees — list with summary + collect.
router.get("/fees", requirePermission("fees.view"), feesCtrl.list);
router.post("/fees", requireAnyPermission("fees.collect", "fees.create"), feesCtrl.create);

module.exports = router;
