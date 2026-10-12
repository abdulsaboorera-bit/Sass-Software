"use strict";

const mongoose = require("mongoose");
const { Exam, ExamResult, ExamSubject, Student, Subject, SchoolSettings } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { parseDateInput } = require("../../utils/dates");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

const DEFAULT_SCALE = [
  { grade: "A+", minPercent: 90, maxPercent: 100, remarks: "Outstanding" },
  { grade: "A", minPercent: 80, maxPercent: 89, remarks: "Excellent" },
  { grade: "B", minPercent: 70, maxPercent: 79, remarks: "Very Good" },
  { grade: "C", minPercent: 60, maxPercent: 69, remarks: "Good" },
  { grade: "D", minPercent: 50, maxPercent: 59, remarks: "Satisfactory" },
  { grade: "E", minPercent: 40, maxPercent: 49, remarks: "Pass" },
  { grade: "F", minPercent: 0, maxPercent: 39, remarks: "Fail" },
];

function gradeFor(percent, scale) {
  const bands = Array.isArray(scale) && scale.length ? scale : DEFAULT_SCALE;
  const band = bands.find((b) => percent >= Number(b.minPercent) && percent <= Number(b.maxPercent));
  return band ? { grade: band.grade, remarks: band.remarks } : { grade: "F", remarks: "Fail" };
}

function percentOf(obtained, total) {
  const t = Number(total || 0);
  if (!t) return 0;
  return +((Number(obtained || 0) / t) * 100).toFixed(2);
}

/** Bulk upsert marks for one exam + subject. */
async function saveMarks({ tenantId, examId, subjectId, records }) {
  if (!examId || !subjectId || !Array.isArray(records)) throw ApiError.badRequest("examId, subjectId and records[] are required");
  const exam = await Exam.findOne({ _id: examId, tenantId }).select("name").lean();
  if (!exam) throw ApiError.notFound("Exam not found");
  const schedule = await ExamSubject.findOne({ tenantId, examId, subjectId }).lean();
  const subject = await Subject.findOne({ _id: subjectId, tenantId }).select("name totalMarks").lean();
  const subjectName = subject?.name || "Subject";
  const totalMarks = schedule?.totalMarks || subject?.totalMarks || 100;
  const settings = await SchoolSettings.findOne({ tenantId }).select("gradingScale").lean();

  let saved = 0;
  for (const rec of records) {
    if (!rec.studentId || rec.marks === undefined || rec.marks === null) continue;
    const marks = Number(rec.marks);
    const grade = gradeFor(percentOf(marks, totalMarks), settings?.gradingScale);
    await ExamResult.findOneAndUpdate(
      { tenantId, examId, studentId: rec.studentId, subjectId },
      {
        $set: {
          tenantId,
          examId,
          studentId: rec.studentId,
          subjectId,
          examName: exam.name,
          subject: subjectName,
          marks,
          totalMarks,
          grade: grade.grade,
          remarks: rec.remarks,
          examDate: rec.examDate ? parseDateInput(rec.examDate) : new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    saved += 1;
  }
  return { saved };
}

/** Per-subject report card for one student in one exam, with class position. */
async function reportCard({ tenantId, studentId, examId }) {
  const student = await Student.findOne({ _id: studentId, tenantId }).populate("class", "name section").lean({ virtuals: true });
  if (!student) throw ApiError.notFound("Student not found");
  const exam = await Exam.findOne({ _id: examId, tenantId }).lean();
  if (!exam) throw ApiError.notFound("Exam not found");
  const settings = await SchoolSettings.findOne({ tenantId }).select("gradingScale passingPercent").lean();

  const results = await ExamResult.find({ tenantId, examId, studentId }).lean();
  const obtained = results.reduce((s, r) => s + Number(r.marks || 0), 0);
  const total = results.reduce((s, r) => s + Number(r.totalMarks || 0), 0);
  const percent = percentOf(obtained, total);
  const grade = gradeFor(percent, settings?.gradingScale);

  // Rank against the rest of the class for this exam.
  const classAgg = await ExamResult.aggregate([
    { $match: { tenantId: oid(tenantId), examId: oid(examId) } },
    { $group: { _id: "$studentId", obtained: { $sum: "$marks" }, total: { $sum: "$totalMarks" } } },
  ]);
  const ranked = classAgg
    .map((r) => ({ studentId: String(r._id), percent: percentOf(r.obtained, r.total) }))
    .sort((a, b) => b.percent - a.percent);
  const position = ranked.findIndex((r) => r.studentId === String(studentId)) + 1;

  const passPercent = Number(settings?.passingPercent ?? 40);
  return {
    student,
    exam,
    subjects: results.map((r) => ({ subject: r.subject, marks: r.marks, totalMarks: r.totalMarks, grade: r.grade, percent: percentOf(r.marks, r.totalMarks) })),
    obtained,
    total,
    percent,
    grade: grade.grade,
    remarks: grade.remarks,
    passed: percent >= passPercent,
    position: position || null,
    classSize: ranked.length,
  };
}

/** Result sheet ranking all students who sat an exam. */
async function resultSheet({ tenantId, examId }) {
  const exam = await Exam.findOne({ _id: examId, tenantId }).lean();
  if (!exam) throw ApiError.notFound("Exam not found");
  const rows = await ExamResult.aggregate([
    { $match: { tenantId: oid(tenantId), examId: oid(examId) } },
    { $group: { _id: "$studentId", obtained: { $sum: "$marks" }, total: { $sum: "$totalMarks" } } },
    { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        studentId: "$_id",
        name: "$student.name",
        admissionNo: "$student.admissionNo",
        obtained: 1,
        total: 1,
        percent: { $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$obtained", "$total"] }, 100] }, 2] }] },
      },
    },
    { $sort: { percent: -1 } },
  ]);
  const settings = await SchoolSettings.findOne({ tenantId }).select("gradingScale").lean();
  return {
    exam,
    results: rows.map((r, i) => ({ ...r, position: i + 1, grade: gradeFor(r.percent, settings?.gradingScale).grade })),
  };
}

module.exports = { saveMarks, reportCard, resultSheet, gradeFor, percentOf, DEFAULT_SCALE };
