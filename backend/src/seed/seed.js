"use strict";

/**
 * Idempotent seed. Creates the platform super admin, one tenant per industry,
 * the owner role for each tenant (single admin login — no receptionist/trainer
 * logins), and demo gym data including a small staff roster.
 *
 *   npm run seed
 */
const { connectDB, disconnectDB } = require("../config/db");
const {
  Tenant, User, TenantRole, TenantUser,
  MembershipPlan, Trainer, Member, Session, CheckIn, GymInvoice, GymPayment,
  GymInventoryItem, StockMovement, Expense, ClassBooking, GymSettings, TrainerSchedule,
  Staff,
  SalonCustomer, SalonServiceCategory, SalonService, SalonStaff, SalonAppointment,
  SalonProduct, SalonStockMovement, SalonInvoice, SalonPayment, SalonExpense,
  SalonSalary, SalonAttendance, SalonSettings,
  Department, Doctor, Patient, Appointment, Prescription, MedicalRecord,
  LabTest, LabResult, ClinicInvoice, ClinicPayment, MedicineCategory, Medicine,
  PharmacySupplier, PharmacyStockMovement, PharmacySale,
  ClinicExpense, ClinicSalary, ClinicAttendance, ClinicSettings,
  Teacher, SchoolClass, Subject, Student, Attendance, TeacherAttendance, Timetable,
  Exam, ExamSubject, ExamResult, Assignment, AssignmentSubmission,
  FeeStructure, FeePayment, SchoolExpense, SchoolSalary,
  LibraryBook, LibraryIssue, TransportRoute, TransportAssignment,
  Hostel, HostelRoom, HostelAllocation, Notice, SchoolEvent, Admission, SchoolSettings,
} = require("../models");
const { hashPassword } = require("../utils/password");
const { SYSTEM_ROLES } = require("./roles");
const { addDays, dayKey } = require("../utils/dates");
const { invoiceRef } = require("../utils/ids");
const env = require("../config/env");

if (env.isProd && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Refusing to seed a production database without ALLOW_PRODUCTION_SEED=true");
}

const INDUSTRIES = [
  { slug: "greenfield-school", name: "Greenfield Academy", industry: "SCHOOL" },
  { slug: "care-plus-clinic", name: "CarePlus Clinic", industry: "CLINIC" },
  { slug: "flame-grill-house", name: "Flame & Grill House", industry: "RESTAURANT" },
  { slug: "iron-pulse-gym", name: "Iron Pulse Gym", industry: "GYM" },
  { slug: "chapter-one-books", name: "Chapter One Books", industry: "BOOKSHOP" },
  { slug: "glow-beauty-lounge", name: "Glow Beauty Lounge", industry: "SALON" },
];

async function upsertUser({ email, name, passwordHash, tenantId }) {
  let user = await User.findOne({ email, tenantId: tenantId || null });
  if (!user) {
    user = await User.create({ email, name, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", tenantId: tenantId || null });
  }
  return user;
}

async function ensureRole(tenantId, def) {
  let role = await TenantRole.findOne({ tenantId, slug: def.slug });
  if (!role) role = await TenantRole.create({ tenantId, ...def });
  else if (role.isSystem) await TenantRole.updateOne({ _id: role._id }, { $set: { name: def.name, isSystem: true } });
  return role;
}

async function ensureMembership(tenantId, userId, roleId) {
  const existing = await TenantUser.findOne({ tenantId, userId, roleId });
  if (!existing) await TenantUser.create({ tenantId, userId, roleId });
}

async function seedGym(tenant, ownerUser) {
  if (await Member.countDocuments({ tenantId: tenant._id })) {
    console.log("  gym demo data already present, skipping");
    return;
  }

  // Plans
  const [monthly, quarterly, annual] = await MembershipPlan.create([
    { tenantId: tenant._id, name: "Monthly", duration: 30, price: 4000 },
    { tenantId: tenant._id, name: "Quarterly", duration: 90, price: 10500 },
    { tenantId: tenant._id, name: "Annual", duration: 365, price: 36000 },
  ]);

  // Trainer directory (no login — the single admin manages everything)
  const [coachBilal, coachSana] = await Trainer.create([
    { tenantId: tenant._id, name: "Coach Bilal", phone: "03001112233", specialization: "Strength", fee: 8000, maxMembers: 30 },
    { tenantId: tenant._id, name: "Coach Sana", phone: "03004445566", specialization: "Cardio & HIIT", fee: 7000, maxMembers: 25 },
  ]);

  // Staff roster (front-desk/cleaning etc.) used only for attendance marking.
  await Staff.create([
    { tenantId: tenant._id, name: "Ali Raza", phone: "03007778899", role: "Front Desk" },
    { tenantId: tenant._id, name: "Sana Bibi", phone: "03006667788", role: "Cleaning" },
  ]);

  // Members — a spread of active / expiring-soon / expired
  const now = new Date();
  const specs = [
    { name: "Ahmed Raza", phone: "03011234501", plan: monthly, offsetDays: 20, trainer: coachBilal },
    { name: "Fatima Noor", phone: "03011234502", plan: quarterly, offsetDays: 2, trainer: coachBilal }, // expiring soon
    { name: "Usman Ali", phone: "03011234503", plan: monthly, offsetDays: -5, trainer: coachSana }, // expired
    { name: "Zainab Khan", phone: "03011234504", plan: annual, offsetDays: 200, trainer: coachSana },
    { name: "Hassan Iqbal", phone: "03011234505", plan: monthly, offsetDays: 12, trainer: null },
  ];

  let i = 0;
  for (const s of specs) {
    i += 1;
    const startDate = addDays(now, s.offsetDays - s.plan.duration);
    const endDate = addDays(now, s.offsetDays);
    const member = await Member.create({
      tenantId: tenant._id,
      memberNo: `M-${String(i).padStart(4, "0")}`,
      name: s.name,
      phone: s.phone,
      planId: s.plan._id,
      trainerId: s.trainer ? s.trainer._id : null,
      startDate,
      endDate,
      status: endDate < now ? "EXPIRED" : "ACTIVE",
      notesHistory: [{ note: "Joined via seed data", createdByName: "System" }],
    });

    // A paid invoice for the initial membership
    const invoice = await GymInvoice.create({
      tenantId: tenant._id,
      memberId: member._id,
      invoiceRef: invoiceRef("INV"),
      type: "MEMBERSHIP",
      planId: s.plan._id,
      amount: s.plan.price,
      paidAmount: s.plan.price,
      status: "PAID",
      dueDate: startDate,
      paidAt: startDate,
      periodStart: startDate,
      periodEnd: endDate,
    });
    await GymPayment.create({
      tenantId: tenant._id,
      memberId: member._id,
      invoiceId: invoice._id,
      amount: s.plan.price,
      method: "CASH",
      type: "MEMBERSHIP",
      paidAt: startDate,
    });

    // A couple of recent check-ins for active members
    if (endDate >= now) {
      await CheckIn.create({ tenantId: tenant._id, memberId: member._id, checkInTime: addDays(now, -1), dayKey: dayKey(addDays(now, -1)) });
      await CheckIn.create({ tenantId: tenant._id, memberId: member._id, checkInTime: now, dayKey: dayKey(now) });
      member.lastAttendanceAt = now;
      member.lastAttendanceDay = dayKey(now);
      member.currentStreak = 2;
      member.longestStreak = 2;
      await member.save();
    }
  }

  // Sessions
  await Session.create([
    { tenantId: tenant._id, trainerId: coachBilal._id, name: "Morning Strength", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", capacity: 15 },
    { tenantId: tenant._id, trainerId: coachSana._id, name: "Evening HIIT", dayOfWeek: 3, startTime: "18:00", endTime: "19:00", capacity: 20 },
  ]);

  // Gym Settings
  await GymSettings.findOneAndUpdate(
    { tenantId: tenant._id },
    {
      tenantId: tenant._id,
      gymName: "Iron Pulse Gym",
      address: "123 Fitness Street, Lahore",
      phone: "03211234567",
      email: "info@ironpulse.com",
      operatingHours: [
        { day: 1, open: "06:00", close: "22:00", isClosed: false },
        { day: 2, open: "06:00", close: "22:00", isClosed: false },
        { day: 3, open: "06:00", close: "22:00", isClosed: false },
        { day: 4, open: "06:00", close: "22:00", isClosed: false },
        { day: 5, open: "06:00", close: "22:00", isClosed: false },
        { day: 6, open: "08:00", close: "20:00", isClosed: false },
        { day: 0, open: "08:00", close: "18:00", isClosed: false },
      ],
      timezone: "Asia/Karachi",
      currency: "PKR",
    },
    { upsert: true, new: true }
  );

  // Gym Inventory Items
  const inventoryItems = await GymInventoryItem.create([
    { tenantId: tenant._id, name: "Whey Protein (2kg)", sku: "SUP-001", category: "SUPPLEMENT", quantity: 25, unit: "pcs", costPrice: 4500, sellPrice: 6000, minStock: 5, supplierName: "NutriZone" },
    { tenantId: tenant._id, name: "Creatine Monohydrate", sku: "SUP-002", category: "SUPPLEMENT", quantity: 40, unit: "pcs", costPrice: 1800, sellPrice: 2500, minStock: 10, supplierName: "NutriZone" },
    { tenantId: tenant._id, name: "Resistance Bands Set", sku: "ACC-001", category: "EQUIPMENT", quantity: 15, unit: "sets", costPrice: 800, sellPrice: 1200, minStock: 5, supplierName: "FitGear" },
    { tenantId: tenant._id, name: "Yoga Mat (6mm)", sku: "ACC-002", category: "EQUIPMENT", quantity: 3, unit: "pcs", costPrice: 1200, sellPrice: 1800, minStock: 5, supplierName: "FitGear" },
    { tenantId: tenant._id, name: "Gym Gloves", sku: "APP-001", category: "MERCHANDISE", quantity: 20, unit: "pairs", costPrice: 500, sellPrice: 900, minStock: 8, supplierName: "FitGear" },
    { tenantId: tenant._id, name: "Cleaning Spray", sku: "CLN-001", category: "OTHER", quantity: 8, unit: "bottles", costPrice: 250, sellPrice: 0, minStock: 3, supplierName: "CleanPro" },
    { tenantId: tenant._id, name: "Dumbbell Set (5-25kg)", sku: "EQP-001", category: "EQUIPMENT", quantity: 4, unit: "sets", costPrice: 35000, sellPrice: 0, minStock: 2, supplierName: "IronWorks" },
  ]);

  // Stock Movements
  if (inventoryItems.length > 0) {
    await StockMovement.create([
      { tenantId: tenant._id, itemId: inventoryItems[0]._id, type: "PURCHASE", quantity: 30, unitPrice: 4500, totalCost: 135000, reference: "PO-001", notes: "Initial stock", createdBy: ownerUser._id },
      { tenantId: tenant._id, itemId: inventoryItems[0]._id, type: "SALE", quantity: 5, unitPrice: 6000, totalCost: 30000, reference: null, notes: "Member sales" },
      { tenantId: tenant._id, itemId: inventoryItems[3]._id, type: "PURCHASE", quantity: 10, unitPrice: 1200, totalCost: 12000, reference: "PO-002", notes: "Restock" },
      { tenantId: tenant._id, itemId: inventoryItems[3]._id, type: "DAMAGED", quantity: 2, unitPrice: 1200, totalCost: 2400, reference: null, notes: "Torn mats" },
    ]);
  }

  // Expenses
  const thisMonth = new Date();
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  await Expense.create([
    { tenantId: tenant._id, category: "RENT", amount: 85000, date: thisMonth, description: "Monthly gym rent", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "UTILITIES", amount: 12000, date: thisMonth, description: "Electricity bill", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "SALARY", amount: 45000, date: thisMonth, description: "Trainer salaries", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "MAINTENANCE", amount: 5000, date: thisMonth, description: "Equipment maintenance", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "RENT", amount: 85000, date: lastMonth, description: "Monthly gym rent", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "UTILITIES", amount: 10500, date: lastMonth, description: "Electricity bill", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "SUPPLIES", amount: 8000, date: lastMonth, description: "Cleaning supplies", paymentMethod: "CASH" },
  ]);

  // Trainer Schedules
  await TrainerSchedule.create([
    { tenantId: tenant._id, trainerId: coachBilal._id, date: addDays(now, 1), startTime: "07:00", endTime: "12:00", type: "SESSION" },
    { tenantId: tenant._id, trainerId: coachBilal._id, date: addDays(now, 3), startTime: "07:00", endTime: "12:00", type: "SESSION" },
    { tenantId: tenant._id, trainerId: coachBilal._id, date: addDays(now, 5), startTime: "07:00", endTime: "12:00", type: "SESSION" },
    { tenantId: tenant._id, trainerId: coachSana._id, date: addDays(now, 2), startTime: "16:00", endTime: "20:00", type: "CLASS" },
    { tenantId: tenant._id, trainerId: coachSana._id, date: addDays(now, 4), startTime: "16:00", endTime: "20:00", type: "CLASS" },
    { tenantId: tenant._id, trainerId: coachSana._id, date: addDays(now, 6), startTime: "09:00", endTime: "13:00", type: "CLASS" },
  ]);

  // Class Bookings
  const activeMembers = await Member.find({ tenantId: tenant._id, status: "ACTIVE" }).limit(3);
  const sessions = await Session.find({ tenantId: tenant._id });
  if (activeMembers.length > 0 && sessions.length > 0) {
    const bookings = [];
    for (const member of activeMembers) {
      for (const sess of sessions) {
        bookings.push({
          tenantId: tenant._id,
          memberId: member._id,
          sessionId: sess._id,
          date: addDays(now, 1),
          status: "BOOKED",
        });
      }
    }
    await ClassBooking.create(bookings);
  }

  console.log("  seeded plans, 2 trainers, 2 staff, 5 members, invoices, check-ins, sessions");
  console.log("  seeded inventory, expenses, settings, schedules, class bookings");
}

async function seedSalon(tenant, ownerUser) {
  if (await SalonCustomer.countDocuments({ tenantId: tenant._id })) {
    console.log("  salon demo data already present, skipping");
    return;
  }

  const now = new Date();

  const cats = await SalonServiceCategory.create([
    { tenantId: tenant._id, name: "Hair", sortOrder: 1 },
    { tenantId: tenant._id, name: "Skin & Facial", sortOrder: 2 },
    { tenantId: tenant._id, name: "Nails", sortOrder: 3 },
    { tenantId: tenant._id, name: "Bridal & Makeup", sortOrder: 4 },
  ]);
  const cat = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  const services = await SalonService.create([
    { tenantId: tenant._id, categoryId: cat["Hair"], name: "Haircut & Styling", duration: 30, price: 1500, costPrice: 200, commissionRate: 15 },
    { tenantId: tenant._id, categoryId: cat["Hair"], name: "Hair Color", duration: 90, price: 6000, costPrice: 1800, commissionRate: 20 },
    { tenantId: tenant._id, categoryId: cat["Hair"], name: "Keratin Treatment", duration: 120, price: 12000, costPrice: 3500, commissionRate: 20 },
    { tenantId: tenant._id, categoryId: cat["Skin & Facial"], name: "Classic Facial", duration: 60, price: 3500, costPrice: 800, commissionRate: 15 },
    { tenantId: tenant._id, categoryId: cat["Skin & Facial"], name: "Hydra Facial", duration: 75, price: 7000, costPrice: 1500, commissionRate: 18 },
    { tenantId: tenant._id, categoryId: cat["Nails"], name: "Manicure & Pedicure", duration: 60, price: 3000, costPrice: 600, commissionRate: 15 },
    { tenantId: tenant._id, categoryId: cat["Bridal & Makeup"], name: "Bridal Makeup", duration: 150, price: 25000, costPrice: 4000, commissionRate: 25 },
    { tenantId: tenant._id, categoryId: cat["Bridal & Makeup"], name: "Party Makeup", duration: 60, price: 6000, costPrice: 1000, commissionRate: 20 },
  ]);

  const staff = await SalonStaff.create([
    { tenantId: tenant._id, name: "Ayesha Malik", phone: "03001110001", role: "Senior Stylist", specialization: "Hair & Color", salary: 60000, commissionRate: 20, joinDate: addDays(now, -400) },
    { tenantId: tenant._id, name: "Hina Shah", phone: "03001110002", role: "Beautician", specialization: "Skin & Facial", salary: 50000, commissionRate: 18, joinDate: addDays(now, -300) },
    { tenantId: tenant._id, name: "Sara Ahmed", phone: "03001110003", role: "Nail Technician", specialization: "Nails", salary: 40000, commissionRate: 15, joinDate: addDays(now, -200) },
    { tenantId: tenant._id, name: "Bilal Khan", phone: "03001110004", role: "Salon Manager", specialization: "Operations", salary: 75000, commissionRate: 0, joinDate: addDays(now, -500) },
    { tenantId: tenant._id, name: "Nadia Iqbal", phone: "03001110005", role: "Receptionist", specialization: "Front Desk", salary: 35000, commissionRate: 0, joinDate: addDays(now, -120) },
  ]);
  const ayesha = staff[0];
  const hina = staff[1];

  const customers = await SalonCustomer.create([
    { tenantId: tenant._id, customerNo: "C-0001", name: "Maryam Javed", phone: "03211234501", gender: "FEMALE", loyaltyPoints: 120 },
    { tenantId: tenant._id, customerNo: "C-0002", name: "Areeba Khan", phone: "03211234502", gender: "FEMALE", loyaltyPoints: 60 },
    { tenantId: tenant._id, customerNo: "C-0003", name: "Sana Tariq", phone: "03211234503", gender: "FEMALE" },
    { tenantId: tenant._id, customerNo: "C-0004", name: "Hira Noor", phone: "03211234504", gender: "FEMALE" },
    { tenantId: tenant._id, customerNo: "C-0005", name: "Usman Sheikh", phone: "03211234505", gender: "MALE" },
  ]);

  const svc = (name) => services.find((s) => s.name === name);
  const buildAppt = (customer, member, names, date, startTime, status) => {
    const chosen = names.map(svc);
    const amount = chosen.reduce((sum, s) => sum + s.price, 0);
    const duration = chosen.reduce((sum, s) => sum + s.duration, 0);
    return {
      tenantId: tenant._id,
      customerId: customer._id,
      staffId: member ? member._id : null,
      serviceIds: chosen.map((c) => c._id),
      date,
      startTime,
      duration,
      amount,
      discount: 0,
      total: amount,
      status,
    };
  };

  const past1 = addDays(now, -6);
  past1.setHours(11, 0, 0, 0);
  const past2 = addDays(now, -2);
  past2.setHours(15, 0, 0, 0);
  const today = new Date(now);
  today.setHours(14, 0, 0, 0);
  const tomorrow = addDays(now, 1);
  tomorrow.setHours(12, 0, 0, 0);

  await SalonAppointment.create([
    buildAppt(customers[0], ayesha, ["Haircut & Styling", "Hair Color"], past1, "11:00", "COMPLETED"),
    buildAppt(customers[1], hina, ["Hydra Facial"], past2, "15:00", "COMPLETED"),
    buildAppt(customers[2], ayesha, ["Keratin Treatment"], today, "14:00", "SCHEDULED"),
    buildAppt(customers[3], hina, ["Classic Facial", "Manicure & Pedicure"], tomorrow, "12:00", "CONFIRMED"),
  ]);

  // Billing: one settled invoice, one open invoice.
  const inv1 = await SalonInvoice.create({
    tenantId: tenant._id, customerId: customers[0]._id, invoiceRef: invoiceRef("SAL"), type: "SERVICE",
    amount: 7500, paidAmount: 7500, status: "PAID", dueDate: past1, paidAt: past1,
  });
  await SalonPayment.create({ tenantId: tenant._id, customerId: customers[0]._id, invoiceId: inv1._id, amount: 7500, method: "CARD", type: "SERVICE", paidAt: past1 });
  await SalonInvoice.create({
    tenantId: tenant._id, customerId: customers[1]._id, invoiceRef: invoiceRef("SAL"), type: "SERVICE",
    amount: 7000, paidAmount: 0, status: "PENDING", dueDate: addDays(now, 7),
  });

  // Retail products + stock movements.
  const products = await SalonProduct.create([
    { tenantId: tenant._id, name: "Argan Hair Serum", sku: "HC-001", category: "HAIRCARE", quantity: 30, unit: "pcs", costPrice: 900, sellPrice: 1500, minStock: 8, supplierName: "Beauty Depot" },
    { tenantId: tenant._id, name: "Vitamin C Face Serum", sku: "SK-001", category: "SKINCARE", quantity: 20, unit: "pcs", costPrice: 1200, sellPrice: 2200, minStock: 6, supplierName: "GlowSupply" },
    { tenantId: tenant._id, name: "Matte Lipstick", sku: "CS-001", category: "COSMETICS", quantity: 4, unit: "pcs", costPrice: 400, sellPrice: 850, minStock: 10, supplierName: "GlowSupply" },
    { tenantId: tenant._id, name: "Nail Polish Set", sku: "CS-002", category: "COSMETICS", quantity: 15, unit: "sets", costPrice: 700, sellPrice: 1300, minStock: 5, supplierName: "Beauty Depot" },
    { tenantId: tenant._id, name: "Disposable Towels", sku: "CN-001", category: "CONSUMABLE", quantity: 200, unit: "pcs", costPrice: 20, sellPrice: 0, minStock: 50, supplierName: "CleanPro" },
  ]);
  await SalonStockMovement.create([
    { tenantId: tenant._id, itemId: products[0]._id, type: "PURCHASE", quantity: 40, unitPrice: 900, totalCost: 36000, reference: "PO-001", createdBy: ownerUser._id },
    { tenantId: tenant._id, itemId: products[0]._id, type: "SALE", quantity: 10, unitPrice: 1500, totalCost: 15000 },
    { tenantId: tenant._id, itemId: products[2]._id, type: "PURCHASE", quantity: 12, unitPrice: 400, totalCost: 4800, reference: "PO-002" },
  ]);

  // Operating expenses.
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  await SalonExpense.create([
    { tenantId: tenant._id, category: "RENT", amount: 120000, date: now, description: "Salon monthly rent", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "UTILITIES", amount: 22000, date: now, description: "Electricity & water", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "SUPPLIES", amount: 35000, date: now, description: "Hair & skin products restock", paymentMethod: "CARD" },
    { tenantId: tenant._id, category: "MARKETING", amount: 15000, date: now, description: "Instagram ads", paymentMethod: "ONLINE" },
    { tenantId: tenant._id, category: "RENT", amount: 120000, date: lastMonth, description: "Salon monthly rent", paymentMethod: "BANK_TRANSFER" },
  ]);

  // Current-month payroll.
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  for (const member of staff) {
    await SalonSalary.create({ tenantId: tenant._id, staffId: member._id, month, baseSalary: member.salary, commission: 0, netPay: member.salary, status: "PENDING" });
  }

  // Today's staff attendance.
  const dk = dayKey(now);
  await SalonAttendance.create(
    staff.map((member) => ({ tenantId: tenant._id, staffId: member._id, date: now, dayKey: dk, status: "PRESENT", checkIn: "09:00" }))
  );

  // Salon settings (singleton).
  await SalonSettings.findOneAndUpdate(
    { tenantId: tenant._id },
    {
      tenantId: tenant._id,
      salonName: "Glow Beauty Lounge",
      tagline: "Where beauty meets luxury",
      address: "45 Gulberg Main Boulevard, Lahore",
      phone: "04211234567",
      email: "hello@glowbeauty.com",
      timezone: "Asia/Karachi",
      currency: "PKR",
      defaultCommissionRate: 15,
      defaultAppointmentDuration: 30,
      operatingHours: [
        { day: 1, open: "10:00", close: "21:00", isClosed: false },
        { day: 2, open: "10:00", close: "21:00", isClosed: false },
        { day: 3, open: "10:00", close: "21:00", isClosed: false },
        { day: 4, open: "10:00", close: "21:00", isClosed: false },
        { day: 5, open: "10:00", close: "22:00", isClosed: false },
        { day: 6, open: "10:00", close: "22:00", isClosed: false },
        { day: 0, open: "12:00", close: "20:00", isClosed: false },
      ],
    },
    { upsert: true, new: true }
  );

  console.log("  seeded service catalogue, 5 staff, 5 customers, appointments, invoices");
  console.log("  seeded products, expenses, payroll, staff attendance, settings");
}

async function seedClinic(tenant, ownerUser) {
  // Drop legacy indexes that are no longer part of the clinic schemas
  // (e.g. ClinicInvoice.invoiceNo from an earlier model revision).
  for (const Model of [
    Department, Doctor, Patient, Appointment, Prescription, MedicalRecord,
    LabTest, LabResult, ClinicInvoice, ClinicPayment, MedicineCategory, Medicine,
    PharmacySupplier, PharmacyStockMovement, PharmacySale, ClinicExpense,
    ClinicSalary, ClinicAttendance, ClinicSettings,
  ]) {
    try { await Model.syncIndexes(); } catch (err) { console.warn(`  index sync failed for ${Model.modelName}: ${err.message}`); }
  }

  if (await Patient.countDocuments({ tenantId: tenant._id })) {
    console.log("  clinic demo data already present, skipping");
    return;
  }

  const now = new Date();

  const departments = await Department.create([
    { tenantId: tenant._id, name: "General Medicine", description: "Primary care and general consultation", location: "Ground Floor" },
    { tenantId: tenant._id, name: "Cardiology", description: "Heart and cardiovascular care", location: "First Floor" },
    { tenantId: tenant._id, name: "Pediatrics", description: "Child and infant care", location: "Ground Floor" },
    { tenantId: tenant._id, name: "Dermatology", description: "Skin, hair and nails", location: "Second Floor" },
  ]);
  const dep = Object.fromEntries(departments.map((d) => [d.name, d._id]));

  const doctors = await Doctor.create([
    { tenantId: tenant._id, name: "Dr. Imran Ahmed", specialization: "General Physician", phone: "03001230001", qualification: "MBBS, FCPS", experience: 12, fee: 1500, salary: 120000, commissionRate: 20, departmentId: dep["General Medicine"], availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], availableTime: "09:00-14:00", joinDate: addDays(now, -800) },
    { tenantId: tenant._id, name: "Dr. Saima Riaz", specialization: "Cardiologist", phone: "03001230002", qualification: "MBBS, FCPS (Cardiology)", experience: 15, fee: 3000, salary: 200000, commissionRate: 25, departmentId: dep["Cardiology"], availableDays: ["Mon", "Wed", "Fri"], availableTime: "10:00-16:00", joinDate: addDays(now, -600) },
    { tenantId: tenant._id, name: "Dr. Bilal Hussain", specialization: "Pediatrician", phone: "03001230003", qualification: "MBBS, DCH", experience: 8, fee: 2000, salary: 150000, commissionRate: 20, departmentId: dep["Pediatrics"], availableDays: ["Tue", "Thu", "Sat"], availableTime: "11:00-17:00", joinDate: addDays(now, -400) },
    { tenantId: tenant._id, name: "Dr. Hina Qureshi", specialization: "Dermatologist", phone: "03001230004", qualification: "MBBS, MCPS", experience: 6, fee: 2500, salary: 130000, commissionRate: 22, departmentId: dep["Dermatology"], availableDays: ["Mon", "Tue", "Thu"], availableTime: "12:00-18:00", joinDate: addDays(now, -200) },
  ]);
  const [imran, saima, bilal, hina] = doctors;

  const patients = await Patient.create([
    { tenantId: tenant._id, patientNo: "P-0001", name: "Adeel Khan", phone: "03211234501", gender: "MALE", dateOfBirth: new Date(1988, 4, 12), bloodGroup: "B+", address: "Model Town, Lahore" },
    { tenantId: tenant._id, patientNo: "P-0002", name: "Nadia Fatima", phone: "03211234502", gender: "FEMALE", dateOfBirth: new Date(1995, 8, 3), bloodGroup: "O+", allergies: "Penicillin" },
    { tenantId: tenant._id, patientNo: "P-0003", name: "Hassan Ali", phone: "03211234503", gender: "MALE", dateOfBirth: new Date(2018, 1, 20), bloodGroup: "A+" },
    { tenantId: tenant._id, patientNo: "P-0004", name: "Sadia Malik", phone: "03211234504", gender: "FEMALE", dateOfBirth: new Date(1979, 11, 30), bloodGroup: "AB+" },
    { tenantId: tenant._id, patientNo: "P-0005", name: "Usman Tariq", phone: "03211234505", gender: "MALE", dateOfBirth: new Date(2000, 6, 15), bloodGroup: "B-" },
  ]);

  const todayAt = (h) => { const d = new Date(now); d.setHours(h, 0, 0, 0); return d; };
  await Appointment.create([
    { tenantId: tenant._id, patientId: patients[0]._id, doctorId: imran._id, date: todayAt(9), time: "09:30", duration: 30, reason: "Fever and flu symptoms", fee: imran.fee, status: "COMPLETED", paymentStatus: "PAID" },
    { tenantId: tenant._id, patientId: patients[1]._id, doctorId: saima._id, date: todayAt(11), time: "11:00", duration: 30, reason: "Chest pain follow-up", fee: saima.fee, status: "CONFIRMED" },
    { tenantId: tenant._id, patientId: patients[2]._id, doctorId: bilal._id, date: addDays(now, 1), time: "11:30", duration: 20, reason: "Vaccination", fee: bilal.fee, status: "SCHEDULED" },
    { tenantId: tenant._id, patientId: patients[3]._id, doctorId: hina._id, date: addDays(now, -3), time: "15:00", duration: 30, reason: "Skin rash", fee: hina.fee, status: "COMPLETED", paymentStatus: "PAID" },
  ]);

  await Prescription.create([
    {
      tenantId: tenant._id, patientId: patients[0]._id, doctorId: imran._id, diagnosis: "Acute viral illness",
      medications: [
        { name: "Paracetamol 500mg", dosage: "1 tablet", frequency: "3x daily", duration: "5 days" },
        { name: "Cetirizine 10mg", dosage: "1 tablet", frequency: "At night", duration: "5 days" },
      ],
      advice: "Plenty of fluids and rest", status: "ISSUED",
    },
    {
      tenantId: tenant._id, patientId: patients[3]._id, doctorId: hina._id, diagnosis: "Contact dermatitis",
      medications: [{ name: "Hydrocortisone Cream", dosage: "Apply thin layer", frequency: "2x daily", duration: "7 days" }],
      status: "DISPENSED",
    },
  ]);

  await MedicalRecord.create([
    { tenantId: tenant._id, patientId: patients[0]._id, type: "CONSULTATION", title: "General check-up", description: "Vitals stable, advised rest." },
    { tenantId: tenant._id, patientId: patients[1]._id, type: "LAB", title: "Lipid profile", description: "Borderline cholesterol." },
  ]);

  const labTests = await LabTest.create([
    { tenantId: tenant._id, name: "Complete Blood Count (CBC)", code: "CBC", category: "Hematology", price: 1200, referenceRange: "See report" },
    { tenantId: tenant._id, name: "Blood Sugar (Fasting)", code: "FBS", category: "Biochemistry", price: 500, unit: "mg/dL", referenceRange: "70-100" },
    { tenantId: tenant._id, name: "Lipid Profile", code: "LIPID", category: "Biochemistry", price: 1800, referenceRange: "See report" },
    { tenantId: tenant._id, name: "Urine Complete", code: "URINE", category: "Pathology", price: 700, referenceRange: "See report" },
  ]);
  await LabResult.create([
    { tenantId: tenant._id, patientId: patients[1]._id, testId: labTests[2]._id, doctorId: saima._id, testName: "Lipid Profile", date: addDays(now, -2), result: "Total cholesterol 210 mg/dL (borderline high)", status: "COMPLETED" },
    { tenantId: tenant._id, patientId: patients[0]._id, testId: labTests[0]._id, doctorId: imran._id, testName: "Complete Blood Count (CBC)", date: addDays(now, -1), result: "Within normal limits", status: "COMPLETED" },
    { tenantId: tenant._id, patientId: patients[4]._id, testId: labTests[1]._id, doctorId: imran._id, testName: "Blood Sugar (Fasting)", date: now, status: "PENDING" },
  ]);

  // Pharmacy catalogue.
  const medCats = await MedicineCategory.create([
    { tenantId: tenant._id, name: "Analgesics", description: "Pain relief" },
    { tenantId: tenant._id, name: "Antibiotics", description: "Bacterial infections" },
    { tenantId: tenant._id, name: "Vitamins & Supplements" },
    { tenantId: tenant._id, name: "Cardiac Care" },
    { tenantId: tenant._id, name: "Dermatology" },
  ]);
  const mc = Object.fromEntries(medCats.map((c) => [c.name, c._id]));
  const supplier = await PharmacySupplier.create([
    { tenantId: tenant._id, name: "MediSupply Distributors", phone: "04211234567", email: "sales@medisupply.pk", contactPerson: "Kamran Sheikh" },
    { tenantId: tenant._id, name: "PharmaLink", phone: "04211234599", contactPerson: "Rabia Anwar" },
  ]);

  const medicines = await Medicine.create([
    { tenantId: tenant._id, categoryId: mc["Analgesics"], name: "Panadol 500mg", genericName: "Paracetamol", brand: "GSK", strength: "500mg", form: "TABLET", sku: "MED-001", quantity: 400, unit: "tablets", minStock: 50, costPrice: 2, sellPrice: 5, supplierId: supplier[0]._id, supplierName: "MediSupply Distributors", expiryDate: addDays(now, 540) },
    { tenantId: tenant._id, categoryId: mc["Antibiotics"], name: "Amoxil 500mg", genericName: "Amoxicillin", brand: "GSK", strength: "500mg", form: "CAPSULE", sku: "MED-002", quantity: 120, unit: "capsules", minStock: 30, costPrice: 12, sellPrice: 25, supplierId: supplier[0]._id, supplierName: "MediSupply Distributors", expiryDate: addDays(now, 300) },
    { tenantId: tenant._id, categoryId: mc["Vitamins & Supplements"], name: "Vitamin D3 5000IU", strength: "5000IU", form: "CAPSULE", sku: "MED-003", quantity: 8, unit: "capsules", minStock: 20, costPrice: 18, sellPrice: 35, supplierId: supplier[1]._id, supplierName: "PharmaLink", expiryDate: addDays(now, 400) },
    { tenantId: tenant._id, categoryId: mc["Cardiac Care"], name: "Concor 5mg", genericName: "Bisoprolol", strength: "5mg", form: "TABLET", sku: "MED-004", quantity: 90, unit: "tablets", minStock: 20, costPrice: 15, sellPrice: 30, supplierName: "PharmaLink", expiryDate: addDays(now, 60) },
    { tenantId: tenant._id, categoryId: mc["Dermatology"], name: "Hydrocortisone Cream 1%", strength: "1%", form: "CREAM", sku: "MED-005", quantity: 25, unit: "tubes", minStock: 10, costPrice: 60, sellPrice: 120, supplierName: "MediSupply Distributors", expiryDate: addDays(now, -10) },
  ]);
  await PharmacyStockMovement.create([
    { tenantId: tenant._id, medicineId: medicines[0]._id, type: "PURCHASE", quantity: 500, unitPrice: 2, totalCost: 1000, reference: "PO-001", createdBy: ownerUser._id },
    { tenantId: tenant._id, medicineId: medicines[0]._id, type: "SALE", quantity: 100, unitPrice: 5, totalCost: 500, reference: "PHM-SEED" },
    { tenantId: tenant._id, medicineId: medicines[1]._id, type: "PURCHASE", quantity: 150, unitPrice: 12, totalCost: 1800, reference: "PO-002" },
  ]);

  // A settled pharmacy sale + one pending.
  const sale1 = await PharmacySale.create({
    tenantId: tenant._id, saleRef: invoiceRef("PHM"), patientId: patients[0]._id,
    items: [
      { medicineId: medicines[0]._id, name: medicines[0].name, quantity: 10, unitPrice: 5, costPrice: 2, total: 50 },
      { medicineId: medicines[1]._id, name: medicines[1].name, quantity: 6, unitPrice: 25, costPrice: 12, total: 150 },
    ],
    subtotal: 200, discount: 0, tax: 0, total: 200, paidAmount: 200, status: "PAID", paymentMethod: "CASH",
  });
  await PharmacySale.create({
    tenantId: tenant._id, saleRef: invoiceRef("PHM"), customerName: "Walk-in customer",
    items: [{ medicineId: medicines[3]._id, name: medicines[3].name, quantity: 3, unitPrice: 30, costPrice: 15, total: 90 }],
    subtotal: 90, discount: 0, tax: 0, total: 90, paidAmount: 0, status: "PENDING",
  });

  // Billing: one settled, one open.
  const inv1 = await ClinicInvoice.create({
    tenantId: tenant._id, patientId: patients[0]._id, invoiceRef: invoiceRef("CLN"), type: "CONSULTATION",
    amount: 1500, paidAmount: 1500, status: "PAID", dueDate: addDays(now, -3), paidAt: addDays(now, -3),
  });
  await ClinicPayment.create({ tenantId: tenant._id, patientId: patients[0]._id, invoiceId: inv1._id, amount: 1500, method: "CASH", type: "CONSULTATION", paidAt: addDays(now, -3) });
  await ClinicInvoice.create({
    tenantId: tenant._id, patientId: patients[1]._id, invoiceRef: invoiceRef("CLN"), type: "LAB",
    amount: 1800, paidAmount: 0, status: "PENDING", dueDate: addDays(now, 7),
  });

  // Operating expenses.
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  await ClinicExpense.create([
    { tenantId: tenant._id, category: "RENT", amount: 150000, date: now, description: "Clinic monthly rent", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "UTILITIES", amount: 28000, date: now, description: "Electricity & water", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "MEDICINES", amount: 85000, date: now, description: "Pharmacy stock purchase", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "RENT", amount: 150000, date: lastMonth, description: "Clinic monthly rent", paymentMethod: "BANK_TRANSFER" },
  ]);

  // Current-month payroll.
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  for (const doctor of doctors) {
    await ClinicSalary.create({ tenantId: tenant._id, doctorId: doctor._id, month, baseSalary: doctor.salary, commission: 0, netPay: doctor.salary, status: "PENDING" });
  }

  // Today's doctor attendance.
  const dk = dayKey(now);
  await ClinicAttendance.create(
    doctors.map((doctor) => ({ tenantId: tenant._id, doctorId: doctor._id, date: now, dayKey: dk, status: "PRESENT", checkIn: "09:00" }))
  );

  // Clinic settings (singleton).
  await ClinicSettings.findOneAndUpdate(
    { tenantId: tenant._id },
    {
      tenantId: tenant._id,
      clinicName: "CarePlus Clinic",
      tagline: "Your health, our priority",
      address: "12 Main Boulevard, Gulberg, Lahore",
      phone: "04211234567",
      email: "info@careplusclinic.com",
      timezone: "Asia/Karachi",
      currency: "PKR",
      registrationNo: "PMC-2024-00921",
      defaultConsultationFee: 1500,
      defaultCommissionRate: 20,
      defaultAppointmentDuration: 30,
      operatingHours: [
        { day: 1, open: "09:00", close: "21:00", isClosed: false },
        { day: 2, open: "09:00", close: "21:00", isClosed: false },
        { day: 3, open: "09:00", close: "21:00", isClosed: false },
        { day: 4, open: "09:00", close: "21:00", isClosed: false },
        { day: 5, open: "09:00", close: "21:00", isClosed: false },
        { day: 6, open: "10:00", close: "18:00", isClosed: false },
        { day: 0, open: "10:00", close: "14:00", isClosed: false },
      ],
    },
    { upsert: true, new: true }
  );

  console.log("  seeded 4 departments, 4 doctors, 5 patients, appointments, prescriptions, lab");
  console.log("  seeded pharmacy (categories, medicines, suppliers, sales), billing, expenses, payroll, settings");
}

async function seedSchool(tenant, ownerUser) {
  for (const Model of [
    SchoolSettings, Teacher, SchoolClass, Subject, Student, Attendance, TeacherAttendance, Timetable,
    Exam, ExamSubject, ExamResult, Assignment, AssignmentSubmission, FeeStructure, FeePayment,
    SchoolExpense, SchoolSalary, LibraryBook, LibraryIssue, TransportRoute, TransportAssignment,
    Hostel, HostelRoom, HostelAllocation, Notice, SchoolEvent, Admission,
  ]) {
    try { await Model.syncIndexes(); } catch (err) { console.warn(`  index sync failed for ${Model.modelName}: ${err.message}`); }
  }

  if (await Student.countDocuments({ tenantId: tenant._id })) {
    console.log("  school demo data already present, skipping");
    return;
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const teachers = await Teacher.create([
    { tenantId: tenant._id, employeeNo: "EMP-0001", name: "Sir Ahmed Raza", gender: "MALE", phone: "03001234501", email: "ahmed.raza@greenfield.edu", designation: "Head Teacher", specialization: "Mathematics", qualification: "M.Sc Mathematics, B.Ed", salary: 120000, joinDate: addDays(now, -900) },
    { tenantId: tenant._id, employeeNo: "EMP-0002", name: "Ms. Fatima Noor", gender: "FEMALE", phone: "03001234502", email: "fatima.noor@greenfield.edu", designation: "Teacher", specialization: "English", qualification: "M.A English", salary: 85000, joinDate: addDays(now, -700) },
    { tenantId: tenant._id, employeeNo: "EMP-0003", name: "Sir Bilal Akram", gender: "MALE", phone: "03001234503", email: "bilal.akram@greenfield.edu", designation: "Teacher", specialization: "Science", qualification: "B.S Physics", salary: 90000, joinDate: addDays(now, -500) },
    { tenantId: tenant._id, employeeNo: "EMP-0004", name: "Ms. Sana Iqbal", gender: "FEMALE", phone: "03001234504", email: "sana.iqbal@greenfield.edu", designation: "Teacher", specialization: "Computer Science", qualification: "B.S Computer Science", salary: 95000, joinDate: addDays(now, -300) },
    { tenantId: tenant._id, employeeNo: "EMP-0005", name: "Mr. Usman Sheikh", gender: "MALE", phone: "03001234505", email: "usman.sheikh@greenfield.edu", designation: "Accountant", specialization: "Finance", qualification: "MBA Finance", salary: 80000, joinDate: addDays(now, -400) },
  ]);
  const [ahmed, fatima, bilal, sana, usman] = teachers;

  const classes = await SchoolClass.create([
    { tenantId: tenant._id, name: "Grade 5", section: "A", teacherId: ahmed._id, roomNo: "R-101", capacity: 40, feeAmount: 8000 },
    { tenantId: tenant._id, name: "Grade 5", section: "B", teacherId: fatima._id, roomNo: "R-102", capacity: 40, feeAmount: 8000 },
    { tenantId: tenant._id, name: "Grade 6", section: "A", teacherId: bilal._id, roomNo: "R-201", capacity: 40, feeAmount: 9000 },
    { tenantId: tenant._id, name: "Grade 7", section: "A", teacherId: sana._id, roomNo: "R-202", capacity: 35, feeAmount: 10000 },
  ]);
  const [g5a, g5b, g6a, g7a] = classes;

  const subjects = await Subject.create([
    { tenantId: tenant._id, classId: g5a._id, name: "Mathematics", code: "MATH5", teacherId: ahmed._id, totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, classId: g5a._id, name: "English", code: "ENG5", teacherId: fatima._id, totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, classId: g5a._id, name: "Science", code: "SCI5", teacherId: bilal._id, totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, classId: g6a._id, name: "Mathematics", code: "MATH6", teacherId: ahmed._id, totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, classId: g7a._id, name: "Computer Science", code: "CS7", teacherId: sana._id, totalMarks: 100, passingMarks: 40 },
  ]);

  const students = await Student.create([
    { tenantId: tenant._id, admissionNo: "ADM-0001", rollNo: "5A-01", name: "Ali Hassan", gender: "MALE", dateOfBirth: new Date(2014, 3, 10), bloodGroup: "B+", fatherName: "Hassan Mahmood", fatherPhone: "03211234501", motherName: "Ayesha Hassan", address: "Model Town, Lahore", city: "Lahore", classId: g5a._id, section: "A", admissionDate: addDays(now, -400) },
    { tenantId: tenant._id, admissionNo: "ADM-0002", rollNo: "5A-02", name: "Hina Aslam", gender: "FEMALE", dateOfBirth: new Date(2014, 6, 22), bloodGroup: "O+", fatherName: "Aslam Khan", fatherPhone: "03211234502", address: "Johar Town, Lahore", city: "Lahore", classId: g5a._id, section: "A", admissionDate: addDays(now, -380) },
    { tenantId: tenant._id, admissionNo: "ADM-0003", rollNo: "5A-03", name: "Bilal Ahmed", gender: "MALE", dateOfBirth: new Date(2014, 1, 5), bloodGroup: "A+", fatherName: "Ahmed Saeed", fatherPhone: "03211234503", city: "Lahore", classId: g5a._id, section: "A", admissionDate: addDays(now, -350) },
    { tenantId: tenant._id, admissionNo: "ADM-0004", rollNo: "5B-01", name: "Sara Malik", gender: "FEMALE", dateOfBirth: new Date(2014, 8, 14), bloodGroup: "AB+", fatherName: "Malik Tariq", fatherPhone: "03211234504", city: "Lahore", classId: g5b._id, section: "B", admissionDate: addDays(now, -200) },
    { tenantId: tenant._id, admissionNo: "ADM-0005", rollNo: "5B-02", name: "Zain Ali", gender: "MALE", dateOfBirth: new Date(2014, 5, 30), bloodGroup: "B-", fatherName: "Ali Raza", fatherPhone: "03211234505", city: "Lahore", classId: g5b._id, section: "B", admissionDate: addDays(now, -180) },
    { tenantId: tenant._id, admissionNo: "ADM-0006", rollNo: "6A-01", name: "Maryam Nawaz", gender: "FEMALE", dateOfBirth: new Date(2013, 2, 18), bloodGroup: "O-", fatherName: "Nawaz Sharif", fatherPhone: "03211234506", city: "Lahore", classId: g6a._id, section: "A", admissionDate: addDays(now, -120) },
    { tenantId: tenant._id, admissionNo: "ADM-0007", rollNo: "6A-02", name: "Hamza Yousaf", gender: "MALE", dateOfBirth: new Date(2013, 10, 9), bloodGroup: "A-", fatherName: "Yousaf Khan", fatherPhone: "03211234507", city: "Lahore", classId: g6a._id, section: "A", admissionDate: addDays(now, -90) },
    { tenantId: tenant._id, admissionNo: "ADM-0008", rollNo: "7A-01", name: "Areeba Fatima", gender: "FEMALE", dateOfBirth: new Date(2012, 7, 12), bloodGroup: "B+", fatherName: "Rashid Mehmood", fatherPhone: "03211234508", city: "Lahore", classId: g7a._id, section: "A", admissionDate: addDays(now, -60) },
  ]);

  // Today's student attendance.
  const dk = dayKey(now);
  await Attendance.create(
    students.map((s, i) => ({ tenantId: tenant._id, studentId: s._id, date: now, dayKey: dk, status: i === 4 ? "ABSENT" : i === 2 ? "LATE" : "PRESENT" }))
  );
  // A few prior days so trends/reports have data.
  for (let d = 1; d <= 5; d += 1) {
    const day = addDays(now, -d);
    await Attendance.create(
      students.map((s, i) => ({ tenantId: tenant._id, studentId: s._id, date: day, dayKey: dayKey(day), status: (i + d) % 7 === 0 ? "ABSENT" : "PRESENT" }))
    );
  }

  // Today's teacher attendance.
  await TeacherAttendance.create(
    teachers.map((t) => ({ tenantId: tenant._id, teacherId: t._id, date: now, dayKey: dk, status: "PRESENT", checkIn: "08:15" }))
  );

  // Timetable for Grade 5-A (Mon–Fri).
  await Timetable.create(
    [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      tenantId: tenant._id,
      classId: g5a._id,
      dayOfWeek,
      periods: [
        { period: 1, subjectId: subjects[0]._id, teacherId: ahmed._id, startTime: "08:30", endTime: "09:15", room: "R-101" },
        { period: 2, subjectId: subjects[1]._id, teacherId: fatima._id, startTime: "09:15", endTime: "10:00", room: "R-101" },
        { period: 3, subjectId: subjects[2]._id, teacherId: bilal._id, startTime: "10:15", endTime: "11:00", room: "R-101" },
      ],
    }))
  );

  // An exam + schedule + marks for Grade 5-A.
  const exam = await Exam.create({
    tenantId: tenant._id, name: "First Term Examination", term: "TERM_1", classId: g5a._id,
    startDate: addDays(now, -20), endDate: addDays(now, -12), status: "COMPLETED",
  });
  await ExamSubject.create([
    { tenantId: tenant._id, examId: exam._id, subjectId: subjects[0]._id, date: addDays(now, -20), totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, examId: exam._id, subjectId: subjects[1]._id, date: addDays(now, -18), totalMarks: 100, passingMarks: 40 },
    { tenantId: tenant._id, examId: exam._id, subjectId: subjects[2]._id, date: addDays(now, -16), totalMarks: 100, passingMarks: 40 },
  ]);
  const gradeFor = (m) => (m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B" : m >= 60 ? "C" : m >= 50 ? "D" : m >= 40 ? "E" : "F");
  const classA = [students[0], students[1], students[2]];
  const marks = [
    { s: 0, m: [92, 85, 88] },
    { s: 1, m: [78, 90, 81] },
    { s: 2, m: [65, 72, 70] },
  ];
  const resultRows = [];
  for (const row of marks) {
    const student = classA[row.s];
    [subjects[0], subjects[1], subjects[2]].forEach((sub, idx) => {
      resultRows.push({
        tenantId: tenant._id, examId: exam._id, studentId: student._id, subjectId: sub._id,
        examName: exam.name, subject: sub.name, marks: row.m[idx], totalMarks: 100,
        grade: gradeFor(row.m[idx]), examDate: addDays(now, -20 + idx * 2),
      });
    });
  }
  await ExamResult.create(resultRows);

  // Homework + one submission.
  const assignment = await Assignment.create({
    tenantId: tenant._id, classId: g5a._id, subjectId: subjects[0]._id, teacherId: ahmed._id,
    title: "Multiplication tables 1–12", description: "Write and memorise tables 1 to 12.", dueDate: addDays(now, 3), maxMarks: 10,
  });
  await AssignmentSubmission.create({
    tenantId: tenant._id, assignmentId: assignment._id, studentId: students[0]._id, content: "Completed all tables.", status: "SUBMITTED",
  });

  // Fee structures + this month's vouchers.
  await FeeStructure.create([
    { tenantId: tenant._id, classId: g5a._id, name: "Monthly Fee", frequency: "MONTHLY", amount: 8000, items: [{ name: "Tuition", amount: 7000 }, { name: "Fees", amount: 1000 }] },
    { tenantId: tenant._id, classId: g6a._id, name: "Monthly Fee", frequency: "MONTHLY", amount: 9000 },
    { tenantId: tenant._id, classId: g7a._id, name: "Monthly Fee", frequency: "MONTHLY", amount: 10000 },
  ]);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
  const feeRows = [];
  for (const [i, student] of students.entries()) {
    const amount = student.classId.equals(g5a._id) || student.classId.equals(g5b._id) ? 8000 : student.classId.equals(g6a._id) ? 9000 : 10000;
    const paid = i % 2 === 0;
    feeRows.push({
      tenantId: tenant._id, studentId: student._id, amount, discount: 0, fine: 0, netAmount: amount,
      month, year: now.getFullYear(), dueDate, status: paid ? "PAID" : "PENDING",
      paidAt: paid ? addDays(now, -2) : null, method: paid ? "CASH" : undefined,
      receiptNo: paid ? invoiceRef("RCP") : undefined,
    });
  }
  await FeePayment.create(feeRows);

  // Expenses.
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  await SchoolExpense.create([
    { tenantId: tenant._id, category: "RENT", amount: 250000, date: now, description: "School building rent", paymentMethod: "BANK_TRANSFER" },
    { tenantId: tenant._id, category: "UTILITIES", amount: 65000, date: now, description: "Electricity & water", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "SUPPLIES", amount: 40000, date: now, description: "Stationery & lab supplies", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "TRANSPORT", amount: 55000, date: now, description: "School van fuel", paymentMethod: "CASH" },
    { tenantId: tenant._id, category: "RENT", amount: 250000, date: lastMonth, description: "School building rent", paymentMethod: "BANK_TRANSFER" },
  ]);

  // Current-month payroll.
  for (const teacher of teachers) {
    await SchoolSalary.create({ tenantId: tenant._id, teacherId: teacher._id, month, baseSalary: teacher.salary, bonuses: 0, deductions: 0, netPay: teacher.salary, status: "PENDING" });
  }

  // Library.
  const books = await LibraryBook.create([
    { tenantId: tenant._id, title: "Oxford Primary Mathematics 5", author: "Oxford University Press", isbn: "9780190700011", category: "Textbook", publisher: "OUP", totalCopies: 30, availableCopies: 27, price: 1200, shelf: "S-1" },
    { tenantId: tenant._id, title: "The Adventures of Tom Sawyer", author: "Mark Twain", isbn: "9780141321115", category: "Fiction", publisher: "Penguin", totalCopies: 10, availableCopies: 9, price: 800, shelf: "S-2" },
    { tenantId: tenant._id, title: "New Oxford Secondary Science", author: "N. Reynolds", category: "Textbook", publisher: "OUP", totalCopies: 25, availableCopies: 25, price: 1100, shelf: "S-3" },
  ]);
  await LibraryIssue.create([
    { tenantId: tenant._id, bookId: books[0]._id, studentId: students[0]._id, issuedAt: addDays(now, -10), dueDate: addDays(now, 4), status: "ISSUED" },
    { tenantId: tenant._id, bookId: books[1]._id, studentId: students[1]._id, issuedAt: addDays(now, -20), dueDate: addDays(now, -6), status: "ISSUED" },
  ]);

  // Transport.
  const route = await TransportRoute.create({
    tenantId: tenant._id, name: "Route A — Model Town", vehicleNo: "LEB-1234", driverName: "Akram Ali", driverPhone: "03011234567", conductorName: "Nadeem", capacity: 30, fare: 2500,
    stops: [{ name: "Model Town", time: "06:50", fare: 2500 }, { name: "Garden Town", time: "07:10", fare: 2000 }, { name: "Canal Road", time: "07:30", fare: 1800 }],
  });
  await TransportAssignment.create([
    { tenantId: tenant._id, studentId: students[0]._id, routeId: route._id, stopName: "Model Town", fare: 2500, status: "ACTIVE" },
    { tenantId: tenant._id, studentId: students[1]._id, routeId: route._id, stopName: "Garden Town", fare: 2000, status: "ACTIVE" },
  ]);

  // Hostel.
  const hostel = await Hostel.create({ tenantId: tenant._id, name: "Boys Hostel A", type: "BOYS", wardenName: "Mr. Saleem", wardenPhone: "03001239999", capacity: 60 });
  const rooms = await HostelRoom.create([
    { tenantId: tenant._id, hostelId: hostel._id, roomNo: "101", floor: "Ground", capacity: 4, occupied: 1, fee: 15000 },
    { tenantId: tenant._id, hostelId: hostel._id, roomNo: "102", floor: "Ground", capacity: 4, occupied: 0, fee: 15000 },
  ]);
  await HostelAllocation.create({ tenantId: tenant._id, studentId: students[5]._id, roomId: rooms[0]._id, status: "ACTIVE" });

  // Notices & events.
  await Notice.create([
    { tenantId: tenant._id, title: "Parent–Teacher Meeting", body: "PTM for all classes will be held this Saturday from 9:00 AM to 1:00 PM.", audience: "ALL", isPinned: true, createdBy: ownerUser._id },
    { tenantId: tenant._id, title: "First Term Result Announced", body: "First term results are now available. Please collect report cards from the class teacher.", audience: "STUDENTS", createdBy: ownerUser._id },
    { tenantId: tenant._id, title: "Staff Meeting", body: "All teaching staff must attend the curriculum meeting on Friday at 2:00 PM.", audience: "TEACHERS", createdBy: ownerUser._id },
  ]);
  await SchoolEvent.create([
    { tenantId: tenant._id, title: "Annual Sports Day", description: "Inter-house sports competition.", type: "SPORTS", location: "School Ground", startDate: addDays(now, 14) },
    { tenantId: tenant._id, title: "Independence Day Assembly", description: "Special assembly and cultural program.", type: "CULTURAL", location: "Auditorium", startDate: addDays(now, 30) },
    { tenantId: tenant._id, title: "Mid-Term Break", description: "School closed for mid-term break.", type: "HOLIDAY", startDate: addDays(now, 45), endDate: addDays(now, 49), isHoliday: true },
  ]);

  // Admissions pipeline.
  await Admission.create([
    { tenantId: tenant._id, applicantName: "Ahmad Subhan", gender: "MALE", guardianName: "Subhan Ali", guardianPhone: "03219990001", classAppliedId: g5a._id, status: "NEW", source: "Walk-in" },
    { tenantId: tenant._id, applicantName: "Eman Fatima", gender: "FEMALE", guardianName: "Faisal Mehmood", guardianPhone: "03219990002", classAppliedId: g6a._id, status: "INTERVIEW", source: "Website", followUpDate: addDays(now, 5) },
    { tenantId: tenant._id, applicantName: "Hassan Raza", gender: "MALE", guardianName: "Raza Ahmed", guardianPhone: "03219990003", classAppliedId: g7a._id, status: "APPROVED", source: "Referral" },
  ]);

  // School settings (singleton).
  await SchoolSettings.findOneAndUpdate(
    { tenantId: tenant._id },
    {
      tenantId: tenant._id,
      schoolName: "Greenfield Academy",
      tagline: "Empowering young minds",
      phone: "04211234567",
      email: "info@greenfield.edu.pk",
      address: "45 Education Street, Gulberg, Lahore",
      website: "https://greenfield.edu.pk",
      principalName: "Dr. Kamran Yousuf",
      registrationNo: "PBC-2023-00456",
      timezone: "Asia/Karachi",
      currency: "PKR",
      academicYear: "2025-2026",
      currentTerm: "TERM_1",
      passingPercent: 40,
      lowAttendanceThreshold: 75,
      feeDueDay: 10,
    },
    { upsert: true, new: true }
  );

  console.log("  seeded 5 teachers, 4 classes, 5 subjects, 8 students, attendance, timetable, exam + results");
  console.log("  seeded fee structures + vouchers, expenses, payroll, library, transport, hostel, notices, events, admissions, settings");
}

async function main() {
  await connectDB();
  console.log("Seeding NexusSoft (MongoDB)...");

  const passwordHash = await hashPassword(env.demoPassword);

  // Platform super admin
  await upsertUser({ email: "admin@nexussoft.io", name: "Super Admin", passwordHash, tenantId: null });
  console.log(`Super admin: admin@nexussoft.io / ${env.demoPassword}`);

  for (const ind of INDUSTRIES) {
    let tenant = await Tenant.findOne({ slug: ind.slug });
    if (!tenant) {
      tenant = await Tenant.create({ slug: ind.slug, name: ind.name, industry: ind.industry, plan: "PROFESSIONAL", status: "ACTIVE" });
    }
    console.log(`Tenant: ${ind.name} (${ind.industry})`);

    // System roles
    const roles = {};
    for (const def of SYSTEM_ROLES) roles[def.slug] = await ensureRole(tenant._id, def);

    // Demo owner user
    const ownerUser = await upsertUser({
      email: `${ind.industry.toLowerCase()}@demo.com`,
      name: `${ind.name} Admin`,
      passwordHash,
      tenantId: tenant._id,
    });
    await ensureMembership(tenant._id, ownerUser._id, roles.owner._id);
    console.log(`  owner login: ${ind.industry.toLowerCase()}@demo.com / ${env.demoPassword}`);

    if (ind.industry === "GYM") await seedGym(tenant, ownerUser);
    if (ind.industry === "SALON") await seedSalon(tenant, ownerUser);
    if (ind.industry === "CLINIC") await seedClinic(tenant, ownerUser);
    if (ind.industry === "SCHOOL") await seedSchool(tenant, ownerUser);
  }

  console.log("\nSeeding complete.");
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try { await disconnectDB(); } catch {}
  process.exit(1);
});
