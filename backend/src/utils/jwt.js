"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * JWT helpers. Claims, algorithm (HS256), issuer, audiences and TTLs are
 * kept byte-for-byte compatible with the previous `jose`-based Next.js
 * implementation, so tokens/cookies issued before the migration keep working.
 *
 * Access token payload: { userId, email, role, tenantId?, tenantSlug? }
 * Refresh token payload: { userId }
 */

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    algorithm: "HS256",
    expiresIn: env.jwt.accessTtl,
    issuer: env.jwt.issuer,
    audience: env.jwt.accessAudience,
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ userId }, env.jwt.secret, {
    algorithm: "HS256",
    expiresIn: env.jwt.refreshTtl,
    issuer: env.jwt.issuer,
    audience: env.jwt.refreshAudience,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: env.jwt.accessAudience,
    });
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: env.jwt.refreshAudience,
    });
  } catch {
    return null;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
