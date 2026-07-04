"use strict";

const bcrypt = require("bcryptjs");

// 12 rounds — identical cost factor to the previous implementation, so
// existing password hashes migrated from PostgreSQL verify unchanged.
const ROUNDS = 12;

function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
