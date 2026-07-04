"use strict";

/**
 * System role definitions (the RBAC the task asks for):
 *  - owner        => full access ("*")
 *  - receptionist => manage members, billing, attendance (+ front desk across modules)
 *  - trainer      => only assigned members + mark attendance + own sessions
 *
 * Permission strings match the existing vocabulary. Two new scoped permissions
 * are introduced for trainers: `members.view.assigned` and `trainers.view.self`.
 */

const OWNER = ["*"];

const RECEPTIONIST = [
  // Gym front desk
  "members.view", "members.create", "members.edit",
  "billing.view", "billing.create", "billing.edit",
  "attendance.view", "attendance.mark", "attendance.edit",
  "sessions.view", "sessions.create", "sessions.edit",
  "trainers.view",
  "notifications.view",
  // Shared front-desk permissions for the other verticals
  "students.view", "students.create", "students.edit",
  "classes.view",
  "fees.view", "fees.collect",
  "patients.view", "patients.create", "patients.edit",
  "appointments.view", "appointments.create", "appointments.edit",
  "doctors.view",
  "orders.view", "orders.create", "orders.edit",
  "menu.view", "tables.view", "tables.edit",
  "sales.view", "sales.create",
  "customers.view", "customers.create",
  "inventory.view",
];

const TRAINER = [
  "members.view.assigned",
  "trainers.view.self",
  "attendance.mark",
  "sessions.view",
];

const SYSTEM_ROLES = [
  { name: "Owner", slug: "owner", permissions: OWNER, isSystem: true },
  { name: "Receptionist", slug: "receptionist", permissions: RECEPTIONIST, isSystem: true },
  { name: "Trainer", slug: "trainer", permissions: TRAINER, isSystem: true },
];

module.exports = { SYSTEM_ROLES, OWNER, RECEPTIONIST, TRAINER };
