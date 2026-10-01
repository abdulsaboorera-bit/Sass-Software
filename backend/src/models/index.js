"use strict";

/**
 * Single import surface for every Mongoose model.
 *   const { Member, GymInvoice, Tenant } = require("../models");
 * Registering them here also guarantees all schemas/indexes are loaded
 * before the server starts handling requests.
 */

// ── Core ─────────────────────────────────────────────────
const Tenant = require("./core/Tenant");
const User = require("./core/User");
const RefreshToken = require("./core/RefreshToken");
const AuditLog = require("./core/AuditLog");
const TenantRole = require("./core/TenantRole");
const TenantUser = require("./core/TenantUser");
const Branch = require("./core/Branch");
const Notification = require("./core/Notification");
const PlatformSubscription = require("./core/PlatformSubscription");
const Message = require("./core/Message");

// ── Gym ──────────────────────────────────────────────────
const MembershipPlan = require("./gym/MembershipPlan");
const Trainer = require("./gym/Trainer");
const Member = require("./gym/Member");
const Session = require("./gym/Session");
const CheckIn = require("./gym/CheckIn");
const GymInvoice = require("./gym/GymInvoice");
const GymPayment = require("./gym/GymPayment");
const BodyMeasurement = require("./gym/BodyMeasurement");
const GymInventoryItem = require("./gym/InventoryItem");
const StockMovement = require("./gym/StockMovement");
const Expense = require("./gym/Expense");
const ClassBooking = require("./gym/ClassBooking");
const GymSettings = require("./gym/GymSettings");
const TrainerSchedule = require("./gym/TrainerSchedule");
const TrainerLeave = require("./gym/TrainerLeave");
const EquipmentMaintenance = require("./gym/EquipmentMaintenance");
const Staff = require("./gym/Staff");
const StaffAttendance = require("./gym/StaffAttendance");

// ── Other verticals ──────────────────────────────────────
const school = require("./school");
const clinic = require("./clinic");
const restaurant = require("./restaurant");
const bookshop = require("./bookshop");
const carRental = require("./carRental");
const realEstate = require("./realEstate");

module.exports = {
  // core
  Tenant,
  User,
  RefreshToken,
  AuditLog,
  TenantRole,
  TenantUser,
  Branch,
  Notification,
  PlatformSubscription,
  Message,
  // gym
  MembershipPlan,
  Trainer,
  Member,
  Session,
  CheckIn,
  GymInvoice,
  GymPayment,
  BodyMeasurement,
  GymInventoryItem,
  StockMovement,
  Expense,
  ClassBooking,
  GymSettings,
  TrainerSchedule,
  TrainerLeave,
  EquipmentMaintenance,
  Staff,
  StaffAttendance,
  // school / clinic / restaurant / bookshop
  ...school,
  ...clinic,
  ...restaurant,
  ...bookshop,
  ...carRental,
  ...realEstate,
};
