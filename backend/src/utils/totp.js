"use strict";

const crypto = require("crypto");

/**
 * Dependency-free Time-based One-Time Password (RFC 6238) helpers plus the
 * RFC 4648 base32 codec that authenticator apps (Google Authenticator, Authy,
 * Microsoft Authenticator, ...) expect for their shared secrets.
 *
 * Everything here is implemented with Node's built-in `crypto`, so no external
 * package is required.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30; // seconds

/** Encode a Buffer as an unpadded base32 string. */
function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** Decode an (optionally padded / spaced) base32 string back to a Buffer. */
function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** New random base32 secret (default 20 bytes = 160 bits, the RFC-recommended size). */
function generateSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

/** HMAC-based one-time password (RFC 4226). */
function hotp(secretBuffer, counter, digits = DEFAULT_DIGITS) {
  const buf = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer; split across two 32-bit halves.
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = crypto.createHmac("sha1", secretBuffer).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 10 ** digits).padStart(digits, "0");
}

/** Current TOTP token for a base32 secret. */
function totp(secret, { period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS, timestamp = Date.now() } = {}) {
  const counter = Math.floor(timestamp / 1000 / period);
  return hotp(base32Decode(secret), counter, digits);
}

/**
 * Verify a user-supplied token against a secret, tolerating clock drift of
 * `window` steps before and after now (default ±1 step = ±30s).
 */
function verifyTotp(secret, token, { period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS, window = 1, timestamp = Date.now() } = {}) {
  if (!secret || !token) return false;
  const normalized = String(token).replace(/\s/g, "");
  if (!new RegExp(`^\\d{${digits}}$`).test(normalized)) return false;

  const step = Math.floor(timestamp / 1000 / period);
  for (let i = -window; i <= window; i += 1) {
    if (hotp(base32Decode(secret), step + i, digits) === normalized) return true;
  }
  return false;
}

/**
 * otpauth:// URI for provisioning in an authenticator app.
 * `label` is usually the user's email; `issuer` shows as the account group.
 */
function keyUri({ secret, label, issuer = "NexusSoft" }) {
  const enc = encodeURIComponent;
  const path = `${enc(issuer)}:${enc(label)}`;
  return `otpauth://totp/${path}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=${DEFAULT_DIGITS}&period=${DEFAULT_PERIOD}`;
}

module.exports = { base32Encode, base32Decode, generateSecret, hotp, totp, verifyTotp, keyUri };
