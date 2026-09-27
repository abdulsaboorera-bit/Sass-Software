"use strict";

/**
 * System role definitions.
 *
 * Every tenant gets exactly one role: Owner (full access, "*"). Gym used to
 * also seed receptionist/trainer login roles with scoped permissions; that
 * multi-role setup was removed in favor of a single admin who manages
 * everything.
 */

const OWNER = ["*"];

const SYSTEM_ROLES = [
  { name: "Owner", slug: "owner", permissions: OWNER, isSystem: true },
];

module.exports = { SYSTEM_ROLES, OWNER };
