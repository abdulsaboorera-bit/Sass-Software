"use strict";

// Prefer the native `bcrypt` binding when it is available: it runs the hash on
// libuv's threadpool so the CPU-heavy work never blocks the event loop, and it
// is several times faster than the pure-JS `bcryptjs` fallback. Both produce
// and verify the same `$2a$/$2b$` hashes, so existing passwords keep working.
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch {
  bcrypt = require("bcryptjs");
}

// Cost factor is configurable via BCRYPT_ROUNDS (default 10). Existing hashes
// are unaffected: bcrypt embeds the cost in the hash itself, so any hash
// (including legacy 12-round ones) still verifies. A lower cost keeps the
// CPU-bound hash/verify step from blocking the event loop on small instances.
const ROUNDS = Math.min(14, Math.max(8, parseInt(process.env.BCRYPT_ROUNDS || "10", 10) || 10));

function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
