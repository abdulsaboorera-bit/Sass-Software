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

const SYSTEM_ROLES = [
  { name: "Owner", slug: "owner", permissions: OWNER, isSystem: true },
  { name: "Receptionist", slug: "receptionist", permissions: RECEPTIONIST, isSystem: true },
  { name: "Trainer", slug: "trainer", permissions: TRAINER, isSystem: true },
  { name: "Accountant", slug: "accountant", permissions: ACCOUNTANT, isSystem: true },
  { name: "Inventory Manager", slug: "inventory-manager", permissions: INVENTORY_MANAGER, isSystem: true },
  { name: "Car Rental Manager", slug: "car-rental-manager", permissions: CAR_RENTAL_MANAGER, isSystem: true },
];

module.exports = { SYSTEM_ROLES, OWNER, RECEPTIONIST, TRAINER, ACCOUNTANT, INVENTORY_MANAGER, CAR_RENTAL_MANAGER };
