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
  else if (role.isSystem) await TenantRole.updateOne({ _id: role._id }, { $set: { name: def.name, permissions: def.permissions, isSystem: true } });
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
