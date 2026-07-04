"use strict";

const { User, Tenant, RefreshToken } = require("../models");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const { REFRESH_MAX_AGE } = require("../utils/cookies");

/**
 * Authenticate an email/password pair and issue a fresh token pair.
 * Mirrors the previous Next.js login route: same status checks, same
 * "delete old refresh tokens then store the new one" behaviour.
 */
async function login({ email, password, userAgent, ipAddress }) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  if (user.status === "SUSPENDED")
    throw ApiError.forbidden("Your account has been suspended. Contact support.");
  if (user.status === "INVITED")
    throw ApiError.forbidden("Please complete your registration first.");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
  if (tenant && tenant.status === "SUSPENDED")
    throw ApiError.forbidden("Your organization's account has been suspended.");

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokens(user, tenant, { userAgent, ipAddress });

  return {
    tokens,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    tenant: tenant
      ? {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          industry: tenant.industry,
          plan: tenant.plan,
          status: tenant.status,
        }
      : null,
  };
}

/** Build + persist an access/refresh pair for a user. */
async function issueTokens(user, tenant, meta = {}) {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ? String(user.tenantId) : undefined,
    tenantSlug: tenant ? tenant.slug : undefined,
  });
  const refreshToken = signRefreshToken(user.id);

  // Rotate: drop the user's old refresh tokens, store the new one.
  await RefreshToken.deleteMany({ userId: user.id });
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    expiresAt: new Date(Date.now() + REFRESH_MAX_AGE),
  });

  return { accessToken, refreshToken };
}

/** Exchange a valid refresh token for a new token pair (rotation). */
async function refresh({ refreshToken, userAgent, ipAddress }) {
  if (!refreshToken) throw ApiError.unauthorized("No refresh token");

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) throw ApiError.unauthorized("Invalid refresh token");

  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) throw ApiError.unauthorized("Refresh token revoked");

  const user = await User.findById(payload.userId);
  if (!user || user.status === "SUSPENDED") throw ApiError.unauthorized("Account unavailable");

  const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
  const tokens = await issueTokens(user, tenant, { userAgent, ipAddress });
  return { tokens, user, tenant };
}

/** Revoke a refresh token (logout). */
async function logout(refreshToken) {
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
}

/**
 * Self-service signup: creates a User. Tenant/role wiring is intentionally
 * left to the onboarding flow (unchanged from before). `role` defaults to a
 * platform role for parity with the existing User model.
 */
async function signup({ email, password, name, phone }) {
  const existing = await User.findOne({ email: String(email).toLowerCase(), tenantId: null });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: String(email).toLowerCase(),
    passwordHash,
    name,
    phone,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  });
  return user;
}

module.exports = { login, refresh, logout, signup, issueTokens };
