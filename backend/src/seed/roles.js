"use strict";

/**
 * System role definitions + permission catalog.
 *
 * Every tenant gets an Owner (full access) plus practical least-privilege
 * presets tailored to its industry. Presets intentionally withhold financial
 * and personal-data modules from operational roles (e.g. a gym manager runs
 * the floor but cannot see billing, expenses or salaries; a teacher manages
 * assignments and attendance but cannot touch fees or payroll).
 *
 * `rolesForIndustry(industry)` returns the base roles + the roles that apply
 * to that vertical; it is used when a tenant is created (signup or by the
 * platform super admin) so the Team & Roles screen is immediately usable.
 */

const INDUSTRIES = ["SCHOOL", "CLINIC", "RESTAURANT", "GYM", "BOOKSHOP", "CAR_RENTAL", "REAL_ESTATE", "SALON"];

const OWNER = ["*"];

// ── Generic / cross-industry presets ─────────────────────
const RECEPTIONIST = [
  "members.view", "members.create", "members.edit", "attendance.view", "attendance.mark",
  "billing.view", "billing.create", "inventory.view", "staff.view", "sessions.view",
];
const TRAINER = ["members.view.assigned", "trainers.view", "attendance.view", "attendance.mark", "sessions.view"];
const ACCOUNTANT = ["billing.view", "billing.create", "billing.edit", "analytics.view"];
const INVENTORY_MANAGER = ["inventory.view", "inventory.create", "inventory.edit", "billing.view"];

// ── GYM ──────────────────────────────────────────────────
const GYM_MANAGER = [
  "members.view", "members.create", "members.edit",
  "attendance.view", "attendance.mark", "attendance.create", "attendance.edit",
  "sessions.view", "sessions.create", "sessions.edit",
  "trainers.view", "trainers.create", "trainers.edit",
  "inventory.view", "inventory.create", "inventory.edit",
  "staff.view", "staff.create", "staff.edit",
  "analytics.view", "settings.*",
];
const GYM_RECEPTIONIST = [
  "members.view", "members.create", "members.edit",
  "attendance.view", "attendance.mark",
  "billing.view", "billing.create",
  "sessions.view", "inventory.view", "staff.view",
];
const GYM_ACCOUNTANT = ["members.view", "billing.view", "billing.create", "billing.edit", "analytics.view"];

// ── SCHOOL ───────────────────────────────────────────────
const SCHOOL_ADMIN = [
  "students.*", "classes.*", "teachers.*", "subjects.*", "timetable.*", "attendance.*",
  "exams.*", "assignments.*", "admissions.*", "fees.*", "expenses.*", "salaries.*",
  "library.*", "transport.*", "hostel.*", "notices.*", "events.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const SCHOOL_MANAGER = [
  "students.*", "classes.*", "teachers.*", "subjects.*", "timetable.*", "attendance.*",
  "exams.*", "assignments.*", "admissions.*", "fees.*", "expenses.*", "salaries.*",
  "library.*", "transport.*", "hostel.*", "notices.*", "events.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const SCHOOL_TEACHER = [
  "students.view", "classes.view", "subjects.view", "timetable.view",
  "attendance.view", "attendance.mark", "attendance.create", "exams.view", "exams.marks",
  "assignments.view", "assignments.create", "assignments.edit",
  "notices.view", "events.view", "admissions.view", "library.view", "analytics.view",
];
const SCHOOL_ACCOUNTANT = [
  "students.view", "classes.view", "fees.*", "expenses.*", "salaries.*", "analytics.view",
];

// ── CLINIC ───────────────────────────────────────────────
const CLINIC_MANAGER = [
  "patients.*", "doctors.*", "appointments.*", "prescriptions.*", "lab.*",
  "pharmacy.*", "billing.*", "expenses.*", "salaries.*", "staff-attendance.*",
  "analytics.view", "settings.*",
];
const CLINIC_DOCTOR = [
  "patients.view", "patients.create", "patients.edit", "doctors.view",
  "appointments.view", "appointments.create", "appointments.edit",
  "prescriptions.view", "prescriptions.create", "prescriptions.edit",
  "lab.view", "lab.create", "lab.edit", "pharmacy.view", "analytics.view",
];
const CLINIC_RECEPTIONIST = [
  "patients.view", "patients.create", "patients.edit", "doctors.view",
  "appointments.view", "appointments.create", "appointments.edit",
  "billing.view", "billing.create", "pharmacy.view", "analytics.view",
];
const CLINIC_ACCOUNTANT = ["patients.view", "billing.*", "expenses.*", "salaries.*", "analytics.view"];
const CLINIC_STAFF = [
  "patients.view", "patients.create", "patients.edit",
  "appointments.view", "appointments.create", "appointments.edit",
  "prescriptions.view", "prescriptions.create", "prescriptions.edit",
  "lab.view", "lab.create", "lab.edit",
  "pharmacy.view", "pharmacy.edit",
  "doctors.view", "billing.view", "billing.create", "analytics.view",
];

// ── RESTAURANT ───────────────────────────────────────────
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
const RESTAURANT_CASHIER = [
  "orders.view", "customers.view", "customers.create",
  "billing.view", "billing.create", "reservations.view", "tables.view", "menu.view",
];
const RESTAURANT_KITCHEN = ["orders.view", "orders.edit", "menu.view", "inventory.view", "tables.view"];

// ── BOOKSHOP ─────────────────────────────────────────────
const BOOKSHOP_MANAGER = [
  "inventory.*", "sales.*", "customers.*", "billing.*", "analytics.view", "settings.*",
];
const BOOKSHOP_CASHIER = [
  "sales.view", "sales.create", "inventory.view", "customers.view", "customers.create",
  "billing.view", "billing.create",
];
const BOOKSHOP_ACCOUNTANT = ["sales.view", "billing.*", "analytics.view", "inventory.view"];

// ── CAR RENTAL ───────────────────────────────────────────
const CAR_RENTAL_MANAGER = [
  "cars.view", "cars.create", "cars.edit", "customers.view", "customers.create", "customers.edit",
  "rentals.view", "rentals.create", "rentals.edit", "billing.view", "billing.create", "billing.edit",
  "analytics.view", "settings.*",
];
const CAR_RENTAL_AGENT = [
  "cars.view", "customers.view", "customers.create", "customers.edit",
  "rentals.view", "rentals.create", "rentals.edit", "billing.view", "billing.create",
];
const CAR_RENTAL_ACCOUNTANT = ["cars.view", "customers.view", "rentals.view", "billing.*", "analytics.view"];

// ── REAL ESTATE ──────────────────────────────────────────
const REAL_ESTATE_MANAGER = [
  "properties.view", "properties.create", "properties.edit", "units.view", "units.create", "units.edit",
  "tenants.view", "tenants.create", "tenants.edit", "leases.view", "leases.create", "leases.edit",
  "billing.view", "billing.create", "billing.edit", "expenses.view", "expenses.create", "expenses.edit",
  "maintenance.view", "maintenance.create", "maintenance.edit", "vendors.view", "vendors.create", "vendors.edit",
  "documents.view", "documents.create", "documents.edit", "tasks.view", "tasks.create", "tasks.edit",
  "analytics.view", "settings.*",
];
const REAL_ESTATE_AGENT = [
  "properties.view", "units.view", "tenants.view", "tenants.create", "tenants.edit",
  "leases.view", "leases.create", "leases.edit", "maintenance.view", "maintenance.create",
  "documents.view", "tasks.view", "tasks.create", "tasks.edit", "analytics.view",
];
const REAL_ESTATE_ACCOUNTANT = [
  "properties.view", "units.view", "tenants.view", "leases.view",
  "billing.*", "expenses.*", "analytics.view",
];

// ── SALON ────────────────────────────────────────────────
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
const SALON_STYLIST = [
  "customers.view", "appointments.view", "appointments.create", "appointments.edit",
  "services.view", "staff.view", "staff-attendance.view", "staff-attendance.create",
];
const SALON_ACCOUNTANT = ["customers.view", "billing.*", "expenses.*", "salaries.*", "analytics.view"];

/**
 * Each definition carries `industries` = the verticals it applies to.
 * "COMMON" roles are seeded for every tenant (owner always; accountant and
 * receptionist are broadly useful front-office/finance presets).
 */
const ROLE_DEFS = [
  { name: "Owner", slug: "owner", permissions: OWNER, isSystem: true, industries: INDUSTRIES },
  { name: "Accountant", slug: "accountant", permissions: ACCOUNTANT, isSystem: true, industries: ["GYM", "BOOKSHOP"] },
  { name: "Receptionist", slug: "receptionist", permissions: RECEPTIONIST, isSystem: true, industries: ["GYM"] },
  { name: "Trainer", slug: "trainer", permissions: TRAINER, isSystem: true, industries: ["GYM"] },
  { name: "Inventory Manager", slug: "inventory-manager", permissions: INVENTORY_MANAGER, isSystem: true, industries: ["GYM", "BOOKSHOP", "RESTAURANT"] },

  { name: "Gym Manager", slug: "gym-manager", permissions: GYM_MANAGER, isSystem: true, industries: ["GYM"] },
  { name: "Gym Receptionist", slug: "gym-receptionist", permissions: GYM_RECEPTIONIST, isSystem: true, industries: ["GYM"] },
  { name: "Gym Accountant", slug: "gym-accountant", permissions: GYM_ACCOUNTANT, isSystem: true, industries: ["GYM"] },

  { name: "School Admin", slug: "school-admin", permissions: SCHOOL_ADMIN, isSystem: true, industries: ["SCHOOL"] },
  { name: "School Manager", slug: "school-manager", permissions: SCHOOL_MANAGER, isSystem: true, industries: ["SCHOOL"] },
  { name: "Teacher", slug: "school-teacher", permissions: SCHOOL_TEACHER, isSystem: true, industries: ["SCHOOL"] },
  { name: "School Accountant", slug: "school-accountant", permissions: SCHOOL_ACCOUNTANT, isSystem: true, industries: ["SCHOOL"] },

  { name: "Clinic Manager", slug: "clinic-manager", permissions: CLINIC_MANAGER, isSystem: true, industries: ["CLINIC"] },
  { name: "Doctor", slug: "clinic-doctor", permissions: CLINIC_DOCTOR, isSystem: true, industries: ["CLINIC"] },
  { name: "Clinic Receptionist", slug: "clinic-receptionist", permissions: CLINIC_RECEPTIONIST, isSystem: true, industries: ["CLINIC"] },
  { name: "Clinic Accountant", slug: "clinic-accountant", permissions: CLINIC_ACCOUNTANT, isSystem: true, industries: ["CLINIC"] },
  { name: "Clinic Staff", slug: "clinic-staff", permissions: CLINIC_STAFF, isSystem: true, industries: ["CLINIC"] },

  { name: "Restaurant Manager", slug: "restaurant-manager", permissions: RESTAURANT_MANAGER, isSystem: true, industries: ["RESTAURANT"] },
  { name: "Restaurant Staff", slug: "restaurant-staff", permissions: RESTAURANT_STAFF, isSystem: true, industries: ["RESTAURANT"] },
  { name: "Cashier", slug: "restaurant-cashier", permissions: RESTAURANT_CASHIER, isSystem: true, industries: ["RESTAURANT"] },
  { name: "Kitchen Staff", slug: "restaurant-kitchen", permissions: RESTAURANT_KITCHEN, isSystem: true, industries: ["RESTAURANT"] },

  { name: "Bookshop Manager", slug: "bookshop-manager", permissions: BOOKSHOP_MANAGER, isSystem: true, industries: ["BOOKSHOP"] },
  { name: "Bookshop Cashier", slug: "bookshop-cashier", permissions: BOOKSHOP_CASHIER, isSystem: true, industries: ["BOOKSHOP"] },
  { name: "Bookshop Accountant", slug: "bookshop-accountant", permissions: BOOKSHOP_ACCOUNTANT, isSystem: true, industries: ["BOOKSHOP"] },

  { name: "Car Rental Manager", slug: "car-rental-manager", permissions: CAR_RENTAL_MANAGER, isSystem: true, industries: ["CAR_RENTAL"] },
  { name: "Rental Agent", slug: "car-rental-agent", permissions: CAR_RENTAL_AGENT, isSystem: true, industries: ["CAR_RENTAL"] },
  { name: "Car Rental Accountant", slug: "car-rental-accountant", permissions: CAR_RENTAL_ACCOUNTANT, isSystem: true, industries: ["CAR_RENTAL"] },

  { name: "Real Estate Manager", slug: "real-estate-manager", permissions: REAL_ESTATE_MANAGER, isSystem: true, industries: ["REAL_ESTATE"] },
  { name: "Real Estate Agent", slug: "real-estate-agent", permissions: REAL_ESTATE_AGENT, isSystem: true, industries: ["REAL_ESTATE"] },
  { name: "Real Estate Accountant", slug: "real-estate-accountant", permissions: REAL_ESTATE_ACCOUNTANT, isSystem: true, industries: ["REAL_ESTATE"] },

  { name: "Salon Manager", slug: "salon-manager", permissions: SALON_MANAGER, isSystem: true, industries: ["SALON"] },
  { name: "Salon Receptionist", slug: "salon-receptionist", permissions: SALON_RECEPTIONIST, isSystem: true, industries: ["SALON"] },
  { name: "Stylist", slug: "salon-stylist", permissions: SALON_STYLIST, isSystem: true, industries: ["SALON"] },
  { name: "Salon Accountant", slug: "salon-accountant", permissions: SALON_ACCOUNTANT, isSystem: true, industries: ["SALON"] },
];

/** All system roles (every industry). Kept for backward compatibility. */
const SYSTEM_ROLES = ROLE_DEFS.map(({ industries, ...def }) => def);

/** Roles that apply to a given industry (owner + that vertical's presets). */
function rolesForIndustry(industry) {
  return ROLE_DEFS.filter((d) => d.industries.includes(industry)).map(({ industries, ...def }) => def);
}

// ── Permission catalog (powers the role editor UI) ───────
const ACTION_LABEL = {
  view: "View", create: "Create", edit: "Edit", delete: "Delete",
  mark: "Mark", collect: "Collect", reports: "Reports", manage: "Manage", update: "Update",
};

/** Build a permission group from a compact resource → actions spec. */
function group(label, resource, actions) {
  return {
    resource,
    label,
    permissions: actions.map((a) => ({ key: `${resource}.${a}`, label: ACTION_LABEL[a] || a })),
  };
}

const COMMON_PERMISSIONS = [
  group("Reports & Analytics", "analytics", ["view"]),
  group("Billing & Payments", "billing", ["view", "create", "edit"]),
  group("Coupons & Discounts", "coupons", ["create", "manage"]),
  group("Loyalty Points", "loyalty", ["view", "manage"]),
  group("Settings", "settings", ["view", "edit", "update", "manage"]),
  group("Notifications", "notifications", ["view", "manage"]),
  group("Audit Logs", "audit", ["view", "manage"]),
];

const PERMISSION_GROUPS = {
  GYM: [
    {
      resource: "members",
      label: "Members",
      permissions: [
        ...["view", "create", "edit"].map((a) => ({ key: `members.${a}`, label: ACTION_LABEL[a] || a })),
        { key: "members.view.assigned", label: "View Assigned Only" },
      ],
    },
    group("Attendance & Check-ins", "attendance", ["view", "mark", "create", "edit"]),
    group("Classes & Sessions", "sessions", ["view", "create", "edit"]),
    group("Trainers", "trainers", ["view", "create", "edit"]),
    group("Staff", "staff", ["view", "create", "edit"]),
    group("Inventory", "inventory", ["view", "create", "edit"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Salaries", "salaries", ["view", "create", "edit"]),
  ],
  SCHOOL: [
    group("Students", "students", ["view", "create", "edit"]),
    group("Classes", "classes", ["view", "create", "edit"]),
    group("Teachers", "teachers", ["view", "create", "edit"]),
    group("Subjects", "subjects", ["view", "create", "edit"]),
    group("Timetable", "timetable", ["view", "create", "edit"]),
    group("Attendance", "attendance", ["view", "mark", "create", "edit"]),
    group("Exams", "exams", ["view", "create", "edit", "marks"]),
    group("Assignments", "assignments", ["view", "create", "edit"]),
    group("Admissions", "admissions", ["view", "create", "edit"]),
    group("Fees", "fees", ["view", "collect", "create", "edit", "reports"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Salaries & Payroll", "salaries", ["view", "create", "edit"]),
    group("Staff Attendance", "staff-attendance", ["view", "create", "edit"]),
    group("Library", "library", ["view", "create", "edit"]),
    group("Transport", "transport", ["view", "create", "edit"]),
    group("Hostel", "hostel", ["view", "create", "edit"]),
    group("Notices", "notices", ["view", "create", "edit"]),
    group("Events", "events", ["view", "create", "edit"]),
  ],
  CLINIC: [
    group("Patients", "patients", ["view", "create", "edit"]),
    group("Doctors", "doctors", ["view", "create", "edit"]),
    group("Appointments", "appointments", ["view", "create", "edit"]),
    group("Prescriptions", "prescriptions", ["view", "create", "edit"]),
    group("Laboratory", "lab", ["view", "create", "edit"]),
    group("Pharmacy", "pharmacy", ["view", "create", "edit"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Salaries", "salaries", ["view", "create", "edit"]),
    group("Staff Attendance", "staff-attendance", ["view", "create", "edit"]),
  ],
  RESTAURANT: [
    group("Orders", "orders", ["view", "create", "edit"]),
    group("Menu", "menu", ["view", "create", "edit"]),
    group("Tables", "tables", ["view", "create", "edit"]),
    group("Reservations", "reservations", ["view", "create", "edit"]),
    group("Customers", "customers", ["view", "create", "edit"]),
    group("Staff", "staff", ["view", "create", "edit"]),
    group("Staff Attendance", "staff-attendance", ["view", "mark", "create", "edit"]),
    group("Inventory", "inventory", ["view", "create", "edit"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Salaries", "salaries", ["view", "create", "edit"]),
  ],
  BOOKSHOP: [
    group("Inventory & Books", "inventory", ["view", "create", "edit"]),
    group("Sales", "sales", ["view", "create", "edit"]),
    group("Customers", "customers", ["view", "create", "edit"]),
  ],
  CAR_RENTAL: [
    group("Cars & Fleet", "cars", ["view", "create", "edit"]),
    group("Customers", "customers", ["view", "create", "edit"]),
    group("Rentals", "rentals", ["view", "create", "edit"]),
  ],
  REAL_ESTATE: [
    group("Properties", "properties", ["view", "create", "edit"]),
    group("Units", "units", ["view", "create", "edit"]),
    group("Tenants", "tenants", ["view", "create", "edit"]),
    group("Leases", "leases", ["view", "create", "edit"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Maintenance", "maintenance", ["view", "create", "edit"]),
    group("Vendors", "vendors", ["view", "create", "edit"]),
    group("Documents", "documents", ["view", "create", "edit"]),
    group("Tasks", "tasks", ["view", "create", "edit"]),
  ],
  SALON: [
    group("Customers", "customers", ["view", "create", "edit"]),
    group("Appointments", "appointments", ["view", "create", "edit"]),
    group("Services", "services", ["view", "create", "edit"]),
    group("Staff", "staff", ["view", "create", "edit"]),
    group("Staff Attendance", "staff-attendance", ["view", "mark", "create", "edit"]),
    group("Inventory & Products", "inventory", ["view", "create", "edit"]),
    group("Expenses", "expenses", ["view", "create", "edit"]),
    group("Salaries", "salaries", ["view", "create", "edit"]),
  ],
};

/** Groups relevant to an industry: its own groups first, then common groups. */
function permissionGroupsFor(industry) {
  return [...(PERMISSION_GROUPS[industry] || []), ...COMMON_PERMISSIONS];
}

module.exports = {
  INDUSTRIES,
  SYSTEM_ROLES,
  rolesForIndustry,
  permissionGroupsFor,
  PERMISSION_GROUPS,
  COMMON_PERMISSIONS,
  // legacy named exports
  OWNER,
  RECEPTIONIST,
  TRAINER,
  ACCOUNTANT,
  INVENTORY_MANAGER,
  CAR_RENTAL_MANAGER,
  REAL_ESTATE_MANAGER,
  SALON_MANAGER,
  SALON_RECEPTIONIST,
  RESTAURANT_MANAGER,
  RESTAURANT_STAFF,
  CLINIC_MANAGER,
  CLINIC_STAFF,
  SCHOOL_MANAGER,
  SCHOOL_TEACHER,
  SCHOOL_ACCOUNTANT,
};
