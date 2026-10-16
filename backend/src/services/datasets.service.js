"use strict";

const PDFDocument = require("pdfkit");
const models = require("../models");
const { toCsv, parseCsv } = require("../utils/csv");
const { ApiError } = require("../utils/apiResponse");
const { sanitize } = require("../utils/crud");

/**
 * Cross-industry dataset registry powering the generic CSV/PDF export and CSV
 * import endpoints (`/api/data/:key/...`). Every entry declares the model, the
 * industry it belongs to, the permission required, and how to render each row.
 *
 * Keeping this in one place means new "download as Excel/PDF" and "bulk import"
 * buttons work for any vertical without writing bespoke controllers.
 */

const d = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const dt = (v) => (v ? new Date(v).toLocaleString() : "");
const money = (v) => (v === null || v === undefined ? "" : Number(v));

// Shorthand: dataset definition.
function def(model, columns, extra = {}) {
  return { model, columns, ...extra };
}

const DATASETS = {
  // ── Gym ────────────────────────────────────────────────
  "gym.members": { industry: "GYM", viewPerm: "members.view", createPerm: "members.create", label: "Members", searchFields: ["name", "memberNo", "phone", "email"],
    importFields: ["name", "phone", "email", "gender", "startDate", "endDate"],
    ...def("Member", [
      { key: "memberNo", label: "Member No" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
      { key: "email", label: "Email" }, { key: "gender", label: "Gender" },
      { label: "Start", map: (r) => d(r.startDate) }, { label: "Expiry", map: (r) => d(r.endDate) },
      { key: "status", label: "Status" },
    ]) },
  "gym.payments": { industry: "GYM", viewPerm: "billing.view", label: "Payments", ...def("GymPayment", [
      { label: "Date", map: (r) => d(r.paidAt) }, { key: "amount", label: "Amount" },
      { key: "method", label: "Method" }, { key: "type", label: "Type" }, { key: "reference", label: "Reference" },
    ]) },
  "gym.plans": { industry: "GYM", viewPerm: "members.view", label: "Plans", ...def("MembershipPlan", [
      { key: "name", label: "Name" }, { key: "price", label: "Price" }, { key: "durationDays", label: "Duration (days)" },
      { key: "isActive", label: "Active" },
    ]) },
  "gym.trainers": { industry: "GYM", viewPerm: "trainers.view", label: "Trainers", ...def("Trainer", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "specialization", label: "Specialty" },
      { key: "isActive", label: "Active" },
    ]) },
  "gym.expenses": { industry: "GYM", viewPerm: "expenses.view", label: "Expenses", ...def("Expense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) }, { key: "paymentMethod", label: "Method" },
    ]) },

  // ── School ─────────────────────────────────────────────
  "school.students": { industry: "SCHOOL", viewPerm: "students.view", createPerm: "students.create", label: "Students", searchFields: ["name", "admissionNo", "phone"],
    importFields: ["name", "admissionNo", "phone", "email", "gender", "dateOfBirth", "guardianName", "guardianPhone", "address"],
    ...def("Student", [
      { key: "admissionNo", label: "Admission No" }, { key: "name", label: "Name" }, { key: "gender", label: "Gender" },
      { label: "DOB", map: (r) => d(r.dateOfBirth) }, { key: "guardianName", label: "Guardian" },
      { key: "guardianPhone", label: "Guardian Phone" }, { key: "isActive", label: "Active" },
    ]) },
  "school.teachers": { industry: "SCHOOL", viewPerm: "teachers.view", label: "Teachers", ...def("Teacher", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
      { key: "subject", label: "Subject" }, { key: "isActive", label: "Active" },
    ]) },
  "school.admissions": { industry: "SCHOOL", viewPerm: "admissions.view", label: "Admissions", ...def("Admission", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status" },
      { label: "Applied", map: (r) => d(r.createdAt) },
    ]) },
  "school.fees": { industry: "SCHOOL", viewPerm: "fees.view", label: "Fee Payments", ...def("FeePayment", [
      { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { label: "Date", map: (r) => d(r.paidAt || r.createdAt) },
    ]) },
  "school.expenses": { industry: "SCHOOL", viewPerm: "expenses.view", label: "Expenses", ...def("SchoolExpense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) },
    ]) },
  "school.library-books": { industry: "SCHOOL", viewPerm: "library.view", label: "Library Books", ...def("LibraryBook", [
      { key: "title", label: "Title" }, { key: "author", label: "Author" }, { key: "isbn", label: "ISBN" },
      { key: "copies", label: "Copies" },
    ]) },

  // ── Clinic ─────────────────────────────────────────────
  "clinic.patients": { industry: "CLINIC", viewPerm: "patients.view", createPerm: "patients.create", label: "Patients", searchFields: ["name", "patientNo", "phone", "cnic"],
    importFields: ["name", "patientNo", "phone", "email", "gender", "bloodGroup", "dateOfBirth", "address"],
    ...def("Patient", [
      { key: "patientNo", label: "Patient No" }, { key: "name", label: "Name" }, { key: "gender", label: "Gender" },
      { key: "phone", label: "Phone" }, { key: "bloodGroup", label: "Blood Group" }, { label: "DOB", map: (r) => d(r.dateOfBirth) },
    ]) },
  "clinic.doctors": { industry: "CLINIC", viewPerm: "doctors.view", label: "Doctors", ...def("Doctor", [
      { key: "name", label: "Name" }, { key: "specialization", label: "Specialty" }, { key: "phone", label: "Phone" },
      { key: "fee", label: "Fee" }, { key: "isActive", label: "Active" },
    ]) },
  "clinic.appointments": { industry: "CLINIC", viewPerm: "appointments.view", label: "Appointments", ...def("Appointment", [
      { label: "Date", map: (r) => d(r.date) }, { key: "time", label: "Time" }, { key: "reason", label: "Reason" },
      { key: "status", label: "Status" }, { key: "fee", label: "Fee" },
    ]) },
  "clinic.prescriptions": { industry: "CLINIC", viewPerm: "prescriptions.view", label: "Prescriptions", ...def("Prescription", [
      { label: "Date", map: (r) => d(r.createdAt) }, { key: "diagnosis", label: "Diagnosis" }, { key: "status", label: "Status" },
    ]) },
  "clinic.lab-tests": { industry: "CLINIC", viewPerm: "lab.view", label: "Lab Tests", ...def("LabTest", [
      { key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "category", label: "Category" }, { key: "price", label: "Price" },
    ]) },
  "clinic.expenses": { industry: "CLINIC", viewPerm: "expenses.view", label: "Expenses", ...def("ClinicExpense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) },
    ]) },

  // ── Restaurant ─────────────────────────────────────────
  "restaurant.customers": { industry: "RESTAURANT", viewPerm: "customers.view", createPerm: "customers.create", label: "Customers", searchFields: ["name", "phone", "customerNo", "email"],
    importFields: ["name", "phone", "email", "address", "notes"],
    ...def("RestaurantCustomer", [
      { key: "customerNo", label: "Customer No" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
      { key: "email", label: "Email" }, { key: "loyaltyPoints", label: "Loyalty Points" }, { key: "totalSpent", label: "Total Spent" },
    ]) },
  "restaurant.menu-items": { industry: "RESTAURANT", viewPerm: "menu.view", label: "Menu Items", ...def("MenuItem", [
      { key: "name", label: "Name" }, { key: "price", label: "Price" }, { key: "costPrice", label: "Cost" },
      { key: "isAvailable", label: "Available" },
    ]) },
  "restaurant.reservations": { industry: "RESTAURANT", viewPerm: "reservations.view", label: "Reservations", ...def("Reservation", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { label: "Date", map: (r) => d(r.date) },
      { key: "time", label: "Time" }, { key: "guests", label: "Guests" }, { key: "status", label: "Status" },
    ]) },
  "restaurant.staff": { industry: "RESTAURANT", viewPerm: "staff.view", label: "Staff", ...def("RestaurantStaff", [
      { key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "phone", label: "Phone" },
      { key: "salary", label: "Salary" }, { key: "isActive", label: "Active" },
    ]) },
  "restaurant.inventory": { industry: "RESTAURANT", viewPerm: "inventory.view", label: "Inventory", ...def("RestaurantInventoryItem", [
      { key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "quantity", label: "Qty" },
      { key: "unit", label: "Unit" }, { key: "costPerUnit", label: "Cost/Unit" },
    ]) },
  "restaurant.expenses": { industry: "RESTAURANT", viewPerm: "expenses.view", label: "Expenses", ...def("RestaurantExpense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) },
    ]) },

  // ── Bookshop ───────────────────────────────────────────
  "bookshop.books": { industry: "BOOKSHOP", viewPerm: "inventory.view", createPerm: "inventory.create", label: "Books", searchFields: ["title", "author", "isbn"],
    importFields: ["title", "author", "isbn", "publisher", "category", "price", "costPrice", "quantity", "minStock"],
    ...def("Book", [
      { key: "title", label: "Title" }, { key: "author", label: "Author" }, { key: "isbn", label: "ISBN" },
      { key: "publisher", label: "Publisher" }, { key: "category", label: "Category" }, { key: "price", label: "Price" },
      { key: "quantity", label: "Qty" },
    ]) },
  "bookshop.customers": { industry: "BOOKSHOP", viewPerm: "customers.view", label: "Customers", ...def("BookCustomer", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
      { key: "loyaltyPoints", label: "Loyalty Points" },
    ]) },
  "bookshop.sales": { industry: "BOOKSHOP", viewPerm: "sales.view", label: "Sales", ...def("Sale", [
      { key: "invoiceNo", label: "Invoice" }, { key: "total", label: "Total" }, { key: "discount", label: "Discount" },
      { key: "paymentMethod", label: "Method" }, { label: "Date", map: (r) => d(r.paidAt) },
    ]) },

  // ── Car Rental ─────────────────────────────────────────
  "car-rental.cars": { industry: "CAR_RENTAL", viewPerm: "cars.view", createPerm: "cars.create", label: "Cars", searchFields: ["name", "plateNumber", "make", "model"],
    importFields: ["name", "plateNumber", "make", "model", "year", "category", "dailyRate", "status"],
    ...def("Car", [
      { key: "name", label: "Name" }, { key: "plateNumber", label: "Plate" }, { key: "make", label: "Make" },
      { key: "model", label: "Model" }, { key: "year", label: "Year" }, { key: "dailyRate", label: "Daily Rate" },
      { key: "status", label: "Status" },
    ]) },
  "car-rental.customers": { industry: "CAR_RENTAL", viewPerm: "customers.view", createPerm: "customers.create", label: "Customers", searchFields: ["name", "phone", "cnic"],
    importFields: ["name", "phone", "email", "cnic", "address", "licenseNumber"],
    ...def("RentalCustomer", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "cnic", label: "CNIC" },
      { key: "licenseNumber", label: "License" }, { key: "email", label: "Email" },
    ]) },
  "car-rental.rentals": { industry: "CAR_RENTAL", viewPerm: "rentals.view", label: "Rentals", ...def("Rental", [
      { label: "Start", map: (r) => d(r.startDate) }, { label: "End", map: (r) => d(r.endDate) },
      { key: "totalAmount", label: "Total" }, { key: "status", label: "Status" },
    ]) },

  // ── Real Estate ────────────────────────────────────────
  "real-estate.properties": { industry: "REAL_ESTATE", viewPerm: "properties.view", createPerm: "properties.create", label: "Properties", searchFields: ["name", "address", "city"],
    importFields: ["name", "address", "city", "type", "description"],
    ...def("Property", [
      { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "address", label: "Address" },
      { key: "city", label: "City" }, { key: "isActive", label: "Active" },
    ]) },
  "real-estate.units": { industry: "REAL_ESTATE", viewPerm: "units.view", label: "Units", ...def("PropertyUnit", [
      { key: "unitNo", label: "Unit No" }, { key: "status", label: "Status" }, { key: "rentAmount", label: "Rent" },
    ]) },
  "real-estate.tenants": { industry: "REAL_ESTATE", viewPerm: "tenants.view", createPerm: "tenants.create", label: "Tenants", searchFields: ["name", "phone", "cnic", "email"],
    importFields: ["name", "phone", "email", "cnic", "address"],
    ...def("LeaseTenant", [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "cnic", label: "CNIC" }, { key: "email", label: "Email" },
    ]) },
  "real-estate.leases": { industry: "REAL_ESTATE", viewPerm: "leases.view", label: "Leases", ...def("Lease", [
      { label: "Start", map: (r) => d(r.startDate) }, { label: "End", map: (r) => d(r.endDate) },
      { key: "rentAmount", label: "Rent" }, { key: "status", label: "Status" },
    ]) },
  "real-estate.payments": { industry: "REAL_ESTATE", viewPerm: "billing.view", label: "Rent Payments", ...def("RentPayment", [
      { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { label: "Date", map: (r) => d(r.paidAt || r.createdAt) },
    ]) },
  "real-estate.maintenance": { industry: "REAL_ESTATE", viewPerm: "maintenance.view", label: "Maintenance", ...def("MaintenanceRequest", [
      { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" },
      { label: "Reported", map: (r) => d(r.createdAt) },
    ]) },
  "real-estate.expenses": { industry: "REAL_ESTATE", viewPerm: "expenses.view", label: "Expenses", ...def("PropertyExpense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) },
    ]) },

  // ── Salon ──────────────────────────────────────────────
  "salon.customers": { industry: "SALON", viewPerm: "customers.view", createPerm: "customers.create", label: "Customers", searchFields: ["name", "phone", "customerNo", "email"],
    importFields: ["name", "phone", "email", "gender", "address", "notes"],
    ...def("SalonCustomer", [
      { key: "customerNo", label: "Customer No" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
      { key: "email", label: "Email" }, { key: "loyaltyPoints", label: "Loyalty Points" }, { key: "totalSpent", label: "Total Spent" },
    ]) },
  "salon.services": { industry: "SALON", viewPerm: "services.view", createPerm: "services.create", label: "Services", searchFields: ["name"],
    importFields: ["name", "description", "duration", "price", "costPrice", "commissionRate"],
    ...def("SalonService", [
      { key: "name", label: "Name" }, { key: "duration", label: "Duration" }, { key: "price", label: "Price" },
      { key: "commissionRate", label: "Commission %" }, { key: "isActive", label: "Active" },
    ]) },
  "salon.staff": { industry: "SALON", viewPerm: "staff.view", label: "Staff", ...def("SalonStaff", [
      { key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "phone", label: "Phone" },
      { key: "salary", label: "Salary" }, { key: "isActive", label: "Active" },
    ]) },
  "salon.appointments": { industry: "SALON", viewPerm: "appointments.view", label: "Appointments", ...def("SalonAppointment", [
      { label: "Date", map: (r) => d(r.date) }, { key: "startTime", label: "Start" }, { key: "endTime", label: "End" },
      { key: "total", label: "Total" }, { key: "status", label: "Status" },
    ]) },
  "salon.products": { industry: "SALON", viewPerm: "inventory.view", label: "Products", ...def("SalonProduct", [
      { key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "quantity", label: "Qty" },
      { key: "sellPrice", label: "Sell Price" },
    ]) },
  "salon.expenses": { industry: "SALON", viewPerm: "expenses.view", label: "Expenses", ...def("SalonExpense", [
      { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" },
      { label: "Date", map: (r) => d(r.date) },
    ]) },
};

/** Resolve a dataset definition together with its live Mongoose model. */
function resolve(key) {
  const entry = DATASETS[key];
  if (!entry) throw ApiError.notFound(`Unknown dataset: ${key}`);
  const Model = models[entry.model];
  if (!Model) throw ApiError.badRequest(`Dataset model missing: ${entry.model}`);
  return { ...entry, Model, key };
}

/** All datasets available for one industry (used to render export menus). */
function listForIndustry(industry) {
  return Object.entries(DATASETS)
    .filter(([, v]) => v.industry === industry)
    .map(([key, v]) => ({ key, label: v.label, importable: Array.isArray(v.importFields) }));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(entry, tenantId, query = {}) {
  const filter = { tenantId };
  if (query.search && entry.searchFields && entry.searchFields.length) {
    filter.$or = entry.searchFields.map((f) => ({ [f]: { $regex: escapeRegex(query.search), $options: "i" } }));
  }
  return filter;
}

async function fetchRows(entry, tenantId, query = {}) {
  const filter = buildFilter(entry, tenantId, query);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 5000, 1), 20000);
  return entry.Model.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}

/** Render a dataset as CSV text. */
async function buildCsv(key, tenantId, query = {}) {
  const entry = resolve(key);
  const rows = await fetchRows(entry, tenantId, query);
  return { filename: `${key.replace(/\./g, "-")}.csv`, csv: toCsv(rows, entry.columns) };
}

/** Stream a dataset as a simple paginated PDF table. */
async function streamPdf(key, tenantId, tenantName, res, query = {}) {
  const entry = resolve(key);
  const rows = await fetchRows(entry, tenantId, query);
  const cols = entry.columns;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${key.replace(/\./g, "-")}.pdf"`);
  doc.pipe(res);

  const left = 40;
  const right = 555;
  const usable = right - left;
  const colWidth = usable / cols.length;

  doc.fontSize(18).fillColor("#0f172a").text(tenantName || "Report");
  doc.moveDown(0.2).fontSize(10).fillColor("#64748b").text(entry.label || key);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(0.6);

  // Header row
  doc.fontSize(8).fillColor("#475569");
  const headerY = doc.y;
  cols.forEach((c, i) => doc.text(c.label || c.key, left + i * colWidth, headerY, { width: colWidth - 4 }));
  const afterHeader = doc.y;
  doc.moveTo(left, afterHeader).lineTo(right, afterHeader).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.4);

  doc.fillColor("#0f172a");
  for (const r of rows) {
    if (doc.y > 780) doc.addPage();
    const y = doc.y;
    cols.forEach((c, i) => {
      const val = c.map ? c.map(r) : r[c.key];
      doc.text(val === undefined || val === null ? "" : String(val), left + i * colWidth, y, { width: colWidth - 4 });
    });
    doc.moveDown(0.5);
  }
  if (rows.length === 0) doc.fontSize(9).fillColor("#94a3b8").text("No records.");

  doc.end();
  return null;
}

/**
 * Import CSV text into a dataset. Only columns listed in `importFields` are
 * accepted; headers may be the field key or the human label (case-insensitive).
 * Each row is sanitized (no tenant/id overrides) and created individually so a
 * single bad row doesn't abort the batch.
 */
async function importCsv(key, tenantId, csvText) {
  const entry = resolve(key);
  if (!Array.isArray(entry.importFields) || entry.importFields.length === 0) {
    throw ApiError.badRequest("This dataset does not support import");
  }

  const { headers, records } = parseCsv(csvText);
  if (!records.length) throw ApiError.badRequest("No rows found in the uploaded file");

  // Map each header to a canonical import field via key or label match.
  const labelToField = {};
  entry.columns.forEach((c) => { if (c.label) labelToField[c.label.toLowerCase()] = c.key; });
  const headerMap = {};
  headers.forEach((h) => {
    const norm = String(h).trim().toLowerCase();
    const field = entry.importFields.includes(h) ? h : entry.importFields.includes(norm) ? norm : labelToField[norm];
    if (field) headerMap[h] = field;
  });

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i];
    const payload = {};
    for (const [header, field] of Object.entries(headerMap)) {
      const raw = rec[header];
      if (raw !== undefined && raw !== "") payload[field] = raw;
    }
    if (Object.keys(payload).length === 0) { skipped += 1; continue; }
    try {
      // eslint-disable-next-line no-await-in-loop
      await entry.Model.create({ ...sanitize(payload), tenantId });
      created += 1;
    } catch (err) {
      skipped += 1;
      if (errors.length < 25) errors.push({ row: i + 2, error: err.message });
    }
  }

  return { created, skipped, total: records.length, errors };
}

module.exports = { DATASETS, resolve, listForIndustry, buildCsv, streamPdf, importCsv, money, dt };
