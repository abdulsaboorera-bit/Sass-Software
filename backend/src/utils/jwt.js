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

// ── Member self-service portal tokens (separate audience) ──
const MEMBER_AUDIENCE = "nexussoft-member";

function signMemberToken({ memberId, tenantId }) {
  return jwt.sign({ memberId: String(memberId), tenantId: String(tenantId), scope: "member" }, env.jwt.secret, {
    algorithm: "HS256",
    expiresIn: "7d",
    issuer: env.jwt.issuer,
    audience: MEMBER_AUDIENCE,
  });
}

function verifyMemberToken(token) {
  try {
    const p = jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: MEMBER_AUDIENCE,
    });
    return p.scope === "member" ? p : null;
  } catch {
    return null;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signMemberToken,
  verifyMemberToken,
};
