"use strict";

const express = require("express");
const { requireAuth, requireTenant, requireIndustry } = require("../../middleware/auth");
const { makeCrudRouter, sanitize } = require("../../utils/crud");
const { requirePermission, requireAnyPermission } = require("../../middleware/rbac");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const {
  Patient,
  Doctor,
  Department,
  Appointment,
  Prescription,
  MedicalRecord,
  LabTest,
  LabResult,
  ClinicExpense,
  ClinicAttendance,
  ClinicSettings,
  MedicineCategory,
  Medicine,
  PharmacySupplier,
} = require("../../models");

const billingCtrl = require("../../controllers/clinic/billing.controller");
const pharmacyCtrl = require("../../controllers/clinic/pharmacy.controller");
const payrollCtrl = require("../../controllers/clinic/payroll.controller");
const analyticsCtrl = require("../../controllers/clinic/analytics.controller");

const router = express.Router();

// Everything in the clinic module requires an authenticated user operating
// inside a tenant whose industry is CLINIC.
router.use(requireAuth, requireTenant, requireIndustry("CLINIC"));

const validateReference = (model, field, label) => async (payload, req) => {
  if (payload[field] && !(await model.exists({ _id: payload[field], tenantId: req.tenantId }))) throw ApiError.badRequest(`Invalid ${label}`);
  return payload;
};

// ── Patients ─────────────────────────────────────────────
router.use(
  "/patients",
  makeCrudRouter({
    model: Patient,
    permission: "patients",
    listKey: "patients",
    itemKey: "patient",
    searchFields: ["name", "patientNo", "phone", "cnic"],
    filterFields: ["isActive", "gender", "bloodGroup"],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      if (!payload.patientNo) {
        const count = await Patient.countDocuments({ tenantId: req.tenantId });
        payload.patientNo = `P-${String(count + 1).padStart(4, "0")}`;
      }
      return payload;
    },
  })
);

// ── Departments ──────────────────────────────────────────
router.use(
  "/departments",
  makeCrudRouter({
    model: Department,
    permission: "doctors",
    listKey: "departments",
    itemKey: "department",
    paginated: false,
    searchFields: ["name"],
    filterFields: ["isActive"],
    perms: { create: "doctors.create", edit: "doctors.create", remove: "doctors.create" },
    sort: { name: 1 },
  })
);

// ── Doctors ──────────────────────────────────────────────
router.use(
  "/doctors",
  makeCrudRouter({
    model: Doctor,
    permission: "doctors",
    listKey: "doctors",
    itemKey: "doctor",
    paginated: false,
    searchFields: ["name", "specialization", "phone"],
    filterFields: ["departmentId", "isActive"],
    populate: [{ path: "department", select: "name" }],
    sort: { name: 1 },
    beforeCreate: validateReference(Department, "departmentId", "department"),
    beforeUpdate: validateReference(Department, "departmentId", "department"),
  })
);

// ── Appointments ─────────────────────────────────────────
router.use(
  "/appointments",
  makeCrudRouter({
    model: Appointment,
    permission: "appointments",
    listKey: "appointments",
    itemKey: "appointment",
    searchFields: ["reason"],
    filterFields: ["status", "doctorId", "patientId", "paymentStatus"],
    populate: [
      { path: "patient", select: "name patientNo phone" },
      { path: "doctor", select: "name specialization" },
    ],
    sort: { date: -1, time: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(Patient, "patientId", "patient")(payload, req);
      await validateReference(Doctor, "doctorId", "doctor")(payload, req);
      if (payload.fee === undefined && payload.doctorId) {
        const doctor = await Doctor.findOne({ _id: payload.doctorId, tenantId: req.tenantId }).select("fee").lean();
        payload.fee = doctor?.fee || 0;
      }
      return payload;
    },
    beforeUpdate: async (payload, req) => {
      await validateReference(Patient, "patientId", "patient")(payload, req);
      await validateReference(Doctor, "doctorId", "doctor")(payload, req);
      return payload;
    },
  })
);

// ── Prescriptions ────────────────────────────────────────
router.use(
  "/prescriptions",
  makeCrudRouter({
    model: Prescription,
    permission: "prescriptions",
    listKey: "prescriptions",
    itemKey: "prescription",
    filterFields: ["patientId", "doctorId", "status"],
    populate: [
      { path: "patient", select: "name patientNo" },
      { path: "doctor", select: "name specialization" },
    ],
    sort: { createdAt: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(Patient, "patientId", "patient")(payload, req);
      await validateReference(Doctor, "doctorId", "doctor")(payload, req);
      return payload;
    },
    beforeUpdate: async (payload, req) => {
      await validateReference(Patient, "patientId", "patient")(payload, req);
      await validateReference(Doctor, "doctorId", "doctor")(payload, req);
      return payload;
    },
  })
);

// ── Medical records ──────────────────────────────────────
router.use(
  "/medical-records",
  makeCrudRouter({
    model: MedicalRecord,
    permission: "patients",
    listKey: "records",
    itemKey: "record",
    filterFields: ["patientId", "type"],
    populate: [{ path: "patient", select: "name patientNo" }],
    sort: { recordedAt: -1 },
    beforeCreate: validateReference(Patient, "patientId", "patient"),
  })
);

// ── Laboratory ───────────────────────────────────────────
router.use(
  "/lab-tests",
  makeCrudRouter({
    model: LabTest,
    permission: "lab",
    listKey: "labTests",
    itemKey: "labTest",
    paginated: false,
    searchFields: ["name", "code", "category"],
    filterFields: ["category", "isActive"],
    sort: { name: 1 },
  })
);

router.use(
  "/lab-results",
  makeCrudRouter({
    model: LabResult,
    permission: "lab",
    listKey: "labResults",
    itemKey: "labResult",
    searchFields: ["testName"],
    filterFields: ["patientId", "testId", "status"],
    populate: [
      { path: "patient", select: "name patientNo" },
      { path: "test", select: "name code" },
    ],
    sort: { date: -1 },
    beforeCreate: async (payload, req) => {
      await validateReference(Patient, "patientId", "patient")(payload, req);
      await validateReference(LabTest, "testId", "lab test")(payload, req);
      return payload;
    },
  })
);

// ── Pharmacy — categories ────────────────────────────────
router.use(
  "/pharmacy/categories",
  makeCrudRouter({
    model: MedicineCategory,
    permission: "pharmacy",
    listKey: "categories",
    itemKey: "category",
    paginated: false,
    searchFields: ["name"],
    sort: { name: 1 },
  })
);

// ── Pharmacy — suppliers ─────────────────────────────────
router.use(
  "/pharmacy/suppliers",
  makeCrudRouter({
    model: PharmacySupplier,
    permission: "pharmacy",
    listKey: "suppliers",
    itemKey: "supplier",
    paginated: false,
    searchFields: ["name", "phone", "contactPerson"],
    filterFields: ["isActive"],
    sort: { name: 1 },
  })
);

// ── Pharmacy — medicines (inventory) ─────────────────────
router.get("/pharmacy/medicines/summary", requirePermission("pharmacy.view"), pharmacyCtrl.summary);
router.get("/pharmacy/medicines/movements", requirePermission("pharmacy.view"), pharmacyCtrl.movements);
router.post("/pharmacy/medicines/movements", requirePermission("pharmacy.edit"), pharmacyCtrl.recordMovement);
router.get("/pharmacy/medicines", requirePermission("pharmacy.view"), pharmacyCtrl.list);
router.post("/pharmacy/medicines", requirePermission("pharmacy.create"), pharmacyCtrl.create);
router.patch("/pharmacy/medicines", requirePermission("pharmacy.edit"), pharmacyCtrl.update);
router.delete("/pharmacy/medicines", requirePermission("pharmacy.edit"), pharmacyCtrl.remove);
router.get("/pharmacy/medicines/:id", requirePermission("pharmacy.view"), pharmacyCtrl.getOne);
router.patch("/pharmacy/medicines/:id", requirePermission("pharmacy.edit"), pharmacyCtrl.update);
router.delete("/pharmacy/medicines/:id", requirePermission("pharmacy.edit"), pharmacyCtrl.remove);

// ── Pharmacy — sales ─────────────────────────────────────
router.get("/pharmacy/sales/summary", requirePermission("pharmacy.view"), pharmacyCtrl.salesSummary);
router.get("/pharmacy/sales", requirePermission("pharmacy.view"), pharmacyCtrl.listSales);
router.post("/pharmacy/sales", requirePermission("pharmacy.edit"), pharmacyCtrl.createSale);
router.get("/pharmacy/sales/:id", requirePermission("pharmacy.view"), pharmacyCtrl.getSale);
router.post("/pharmacy/sales/:id/cancel", requirePermission("pharmacy.edit"), pharmacyCtrl.cancelSale);

// ── Billing (invoices + payments) ────────────────────────
router.get("/invoices", requirePermission("billing.view"), billingCtrl.listInvoices);
router.get("/invoices/:id", requirePermission("billing.view"), billingCtrl.getInvoice);
router.post("/invoices", requirePermission("billing.create"), billingCtrl.createInvoice);
router.post("/invoices/:id/cancel", requirePermission("billing.edit"), billingCtrl.cancelInvoice);
router.get("/payments", requirePermission("billing.view"), billingCtrl.listPayments);
router.post("/payments", requirePermission("billing.create"), billingCtrl.recordPayment);
router.patch("/payments", requirePermission("billing.edit"), billingCtrl.updatePayment);
router.patch("/payments/:id", requirePermission("billing.edit"), billingCtrl.updatePayment);
router.delete("/payments", requirePermission("billing.edit"), billingCtrl.deletePayment);
router.delete("/payments/:id", requirePermission("billing.edit"), billingCtrl.deletePayment);
router.post("/mark-overdue", requirePermission("billing.edit"), billingCtrl.markOverdue);

// ── Expenses ─────────────────────────────────────────────
router.use(
  "/expenses",
  makeCrudRouter({
    model: ClinicExpense,
    permission: "expenses",
    listKey: "expenses",
    itemKey: "expense",
    searchFields: ["description", "reference"],
    filterFields: ["category", "status"],
    sort: { date: -1 },
  })
);

// ── Payroll (salaries) ───────────────────────────────────
router.get("/salaries/summary", requirePermission("salaries.view"), payrollCtrl.summary);
router.post("/salaries/generate", requirePermission("salaries.create"), payrollCtrl.generate);
router.get("/salaries", requirePermission("salaries.view"), payrollCtrl.list);
router.post("/salaries/:id/pay", requirePermission("salaries.edit"), payrollCtrl.markPaid);
router.get("/salaries/:id", requirePermission("salaries.view"), payrollCtrl.getOne);
router.patch("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.update);
router.patch("/salaries", requirePermission("salaries.edit"), payrollCtrl.update);
router.delete("/salaries", requirePermission("salaries.edit"), payrollCtrl.remove);
router.delete("/salaries/:id", requirePermission("salaries.edit"), payrollCtrl.remove);

// ── Doctor attendance ────────────────────────────────────
router.use(
  "/staff-attendance",
  makeCrudRouter({
    model: ClinicAttendance,
    permission: "staff-attendance",
    listKey: "attendance",
    itemKey: "attendance",
    filterFields: ["doctorId", "status", "dayKey"],
    populate: [{ path: "staff", select: "name specialization" }],
    sort: { date: -1 },
    beforeCreate: validateReference(Doctor, "doctorId", "doctor"),
  })
);

// ── Analytics / reports ──────────────────────────────────
const canView = requireAnyPermission("analytics.view", "billing.view", "appointments.view");
router.get("/analytics/dashboard", canView, analyticsCtrl.dashboard);
router.get("/analytics/patients", canView, analyticsCtrl.patients);
router.get("/analytics/appointments", canView, analyticsCtrl.appointments);
router.get("/analytics/revenue", canView, analyticsCtrl.revenue);
router.get("/analytics/top-doctors", canView, analyticsCtrl.topDoctors);
router.get("/analytics/inventory", canView, analyticsCtrl.inventory);
router.get("/analytics/pharmacy", canView, analyticsCtrl.pharmacy);
router.get("/analytics/pending-invoices", requirePermission("billing.view"), analyticsCtrl.pendingInvoices);

// ── Settings (tenant singleton) ──────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await ClinicSettings.findOne({ tenantId: req.tenantId }).lean({ virtuals: true });
  return apiSuccess(res, { settings: settings || { tenantId: req.tenantId } });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = sanitize(req.body);
  const settings = await ClinicSettings.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $set: updates, $setOnInsert: { tenantId: req.tenantId } },
    { new: true, upsert: true, runValidators: true }
  ).lean({ virtuals: true });
  return apiSuccess(res, { settings });
});

router.get("/settings", requirePermission("settings.view"), getSettings);
router.patch("/settings", requirePermission("settings.edit"), updateSettings);

module.exports = router;
