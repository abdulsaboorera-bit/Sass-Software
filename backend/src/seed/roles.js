"use strict";

/**
 * System role definitions.
 *
 * Every tenant gets an owner plus practical least-privilege presets. Custom
 * roles can be added later without changing route permissions.
 */

const OWNER = ["*"];
const RECEPTIONIST = [
  "members.view", "members.create", "members.edit", "attendance.view", "attendance.mark",
  "billing.view", "billing.create", "inventory.view", "staff.view", "staff-attendance.view",
  "staff-attendance.create", "sessions.view", "bookings.view", "bookings.create",
];
const TRAINER = ["members.view.assigned", "trainers.view", "attendance.view", "attendance.mark", "sessions.view", "bookings.view"];
const ACCOUNTANT = ["members.view", "billing.view", "billing.create", "billing.edit", "analytics.view"];
const INVENTORY_MANAGER = ["inventory.view", "inventory.create", "inventory.edit", "billing.view"];
const CAR_RENTAL_MANAGER = ["cars.view", "cars.create", "cars.edit", "customers.view", "customers.create", "customers.edit", "rentals.view", "rentals.create", "rentals.edit", "billing.view", "billing.create", "billing.edit", "analytics.view"];
const REAL_ESTATE_MANAGER = [
  "properties.view", "properties.create", "properties.edit", "units.view", "units.create", "units.edit",
  "tenants.view", "tenants.create", "tenants.edit", "leases.view", "leases.create", "leases.edit",
  "billing.view", "billing.create", "billing.edit", "expenses.view", "expenses.create", "expenses.edit",
  "maintenance.view", "maintenance.create", "maintenance.edit", "vendors.view", "vendors.create", "vendors.edit",
  "documents.view", "documents.create", "documents.edit", "tasks.view", "tasks.create", "tasks.edit",
  "analytics.view",
];
const SALON_MANAGER = [
  "customers.*", "services.*", "appointments.*", "staff.*", "staff-attendance.*",
  "salaries.*", "inventory.*", "expenses.*", "billing.*", "analytics.view", "settings.*",
];
const SALON_RECEPTIONIST = [
  "customers.view", "customers.create", "customers.edit",
  "services.view", "appointments.view", "appointments.create", "appointments.edit",
  "staff.view", "staff-attendance.view", "staff-attendance.create",
  "inventory.view", "billing.view", "billing.create", "analytics.view",
];
const RESTAURANT_MANAGER = [
  "customers.*", "staff.*", "tables.*", "orders.*", "menu.*", "reservations.*",
  "inventory.*", "expenses.*", "salaries.*", "billing.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const RESTAURANT_STAFF = [
  "customers.view", "customers.create",
  "tables.view", "menu.view",
  "orders.view", "orders.create", "orders.edit",
  "reservations.view", "reservations.create",
  "staff.view", "staff-attendance.view", "staff-attendance.create",
  "inventory.view", "billing.view", "analytics.view",
];
const CLINIC_MANAGER = [
  "patients.*", "doctors.*", "appointments.*", "prescriptions.*", "lab.*",
  "pharmacy.*", "billing.*", "expenses.*", "salaries.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const CLINIC_STAFF = [
  "patients.view", "patients.create", "patients.edit",
  "appointments.view", "appointments.create", "appointments.edit",
  "prescriptions.view", "prescriptions.create", "prescriptions.edit",
  "lab.view", "lab.create", "lab.edit",
  "pharmacy.view", "pharmacy.edit",
  "doctors.view", "billing.view", "billing.create", "analytics.view",
];
const SCHOOL_MANAGER = [
  "students.*", "classes.*", "teachers.*", "subjects.*", "timetable.*", "attendance.*",
  "exams.*", "assignments.*", "admissions.*", "fees.*", "expenses.*", "salaries.*",
  "library.*", "transport.*", "hostel.*", "notices.*", "events.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const SCHOOL_TEACHER = [
  "students.view", "classes.view", "subjects.view", "timetable.view",
  "attendance.view", "attendance.mark", "exams.view", "exams.marks",
  "assignments.view", "assignments.create", "assignments.edit",
  "notices.view", "events.view", "admissions.view", "library.view", "analytics.view",
];
const SCHOOL_ACCOUNTANT = [
  "students.view", "classes.view", "fees.*", "expenses.*", "salaries.*", "analytics.view",
];

const SYSTEM_ROLES = [
  { name: "Owner", slug: "owner", permissions: OWNER, isSystem: true },
  { name: "Receptionist", slug: "receptionist", permissions: RECEPTIONIST, isSystem: true },
  { name: "Trainer", slug: "trainer", permissions: TRAINER, isSystem: true },
  { name: "Accountant", slug: "accountant", permissions: ACCOUNTANT, isSystem: true },
  { name: "Inventory Manager", slug: "inventory-manager", permissions: INVENTORY_MANAGER, isSystem: true },
  { name: "Car Rental Manager", slug: "car-rental-manager", permissions: CAR_RENTAL_MANAGER, isSystem: true },
  { name: "Real Estate Manager", slug: "real-estate-manager", permissions: REAL_ESTATE_MANAGER, isSystem: true },
  { name: "Salon Manager", slug: "salon-manager", permissions: SALON_MANAGER, isSystem: true },
  { name: "Salon Receptionist", slug: "salon-receptionist", permissions: SALON_RECEPTIONIST, isSystem: true },
  { name: "Restaurant Manager", slug: "restaurant-manager", permissions: RESTAURANT_MANAGER, isSystem: true },
  { name: "Restaurant Staff", slug: "restaurant-staff", permissions: RESTAURANT_STAFF, isSystem: true },
  { name: "Clinic Manager", slug: "clinic-manager", permissions: CLINIC_MANAGER, isSystem: true },
  { name: "Clinic Staff", slug: "clinic-staff", permissions: CLINIC_STAFF, isSystem: true },
  { name: "School Manager", slug: "school-manager", permissions: SCHOOL_MANAGER, isSystem: true },
  { name: "School Teacher", slug: "school-teacher", permissions: SCHOOL_TEACHER, isSystem: true },
  { name: "School Accountant", slug: "school-accountant", permissions: SCHOOL_ACCOUNTANT, isSystem: true },
];

module.exports = { SYSTEM_ROLES, OWNER, RECEPTIONIST, TRAINER, ACCOUNTANT, INVENTORY_MANAGER, CAR_RENTAL_MANAGER, REAL_ESTATE_MANAGER, SALON_MANAGER, SALON_RECEPTIONIST, RESTAURANT_MANAGER, RESTAURANT_STAFF, CLINIC_MANAGER, CLINIC_STAFF, SCHOOL_MANAGER, SCHOOL_TEACHER, SCHOOL_ACCOUNTANT };
