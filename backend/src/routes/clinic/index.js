"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../../middleware/auth");
const { makeCrudRouter } = require("../../utils/crud");
const {
  Patient, Doctor, Department, Appointment, Prescription, MedicalRecord, ClinicInvoice, ClinicPayment,
} = require("../../models");

const router = express.Router();
router.use(requireAuth, requireTenant);

router.use("/patients", makeCrudRouter({
  model: Patient, permission: "patients", listKey: "patients", itemKey: "patient",
  searchFields: ["name", "patientNo", "phone"],
}));

router.use("/doctors", makeCrudRouter({
  model: Doctor, permission: "doctors", listKey: "doctors", itemKey: "doctor", paginated: false,
  searchFields: ["name", "specialization"], filterFields: ["departmentId", "isActive"],
  perms: { edit: "doctors.create" }, populate: [{ path: "department", select: "name" }],
}));

router.use("/departments", makeCrudRouter({
  model: Department, permission: "doctors", listKey: "departments", itemKey: "department", paginated: false,
  searchFields: ["name"], perms: { create: "doctors.create", edit: "doctors.create" },
}));

router.use("/appointments", makeCrudRouter({
  model: Appointment, permission: "appointments", listKey: "appointments", itemKey: "appointment",
  filterFields: ["doctorId", "patientId", "status"],
  populate: [{ path: "patient", select: "name patientNo" }, { path: "doctor", select: "name specialization" }],
}));

router.use("/prescriptions", makeCrudRouter({
  model: Prescription, permission: "appointments", listKey: "prescriptions", itemKey: "prescription",
  filterFields: ["patientId", "doctorId"],
  populate: [{ path: "patient", select: "name" }, { path: "doctor", select: "name" }],
}));

router.use("/medical-records", makeCrudRouter({
  model: MedicalRecord, permission: "patients", listKey: "records", itemKey: "record",
  filterFields: ["patientId", "type"],
}));

router.use("/invoices", makeCrudRouter({
  model: ClinicInvoice, permission: "billing", listKey: "invoices", itemKey: "invoice",
  filterFields: ["patientId", "status"], populate: [{ path: "patient", select: "name patientNo" }],
}));

router.use("/payments", makeCrudRouter({
  model: ClinicPayment, permission: "billing", listKey: "payments", itemKey: "payment",
  filterFields: ["invoiceId"],
}));

module.exports = router;
