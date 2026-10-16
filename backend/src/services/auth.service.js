"use strict";

const { User, Tenant, TenantRole, TenantUser, RefreshToken } = require("../models");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const { REFRESH_MAX_AGE } = require("../utils/cookies");
const { SYSTEM_ROLES } = require("../seed/roles");
const { verifyTotp, generateSecret, keyUri } = require("../utils/totp");
const { randomCode } = require("../utils/ids");

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "gym";
}

async function uniqueTenantSlug(name) {
  const base = slugify(name);
  let slug = base;
  for (let attempt = 0; await Tenant.exists({ slug }); attempt += 1) {
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return slug;
}

const ACTIVE_TENANT_STATUSES = ["ACTIVE", "TRIAL"];

/**
 * Authenticate an email/password pair and issue a fresh token pair.
 * Mirrors the previous Next.js login route: same status checks, same
 * "delete old refresh tokens then store the new one" behaviour.
 */
async function login({ email, password, code, userAgent, ipAddress }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    "+passwordHash +twoFactorSecret +twoFactorRecoveryCodes"
  );
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  if (user.status === "SUSPENDED")
    throw ApiError.forbidden("Your account has been suspended. Contact support.");
  if (user.status === "INVITED")
    throw ApiError.forbidden("Please complete your registration first.");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  // Second factor: if enabled, require a valid TOTP code (or a recovery code).
  if (user.twoFactorEnabled) {
    if (!code) return { twoFactorRequired: true };
    const validTotp = verifyTotp(user.twoFactorSecret, code);
    if (!validTotp) {
      const usedRecovery = await consumeRecoveryCode(user, code);
      if (!usedRecovery) throw ApiError.unauthorized("Invalid authentication code");
    }
  }

  const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
  if (tenant && !ACTIVE_TENANT_STATUSES.includes(tenant.status))
    throw ApiError.forbidden("Your organization's account has been suspended.");

  // Stamp the login and mint tokens concurrently — they don't depend on each other.
  const [, tokens] = await Promise.all([
    User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }),
    issueTokens(user, tenant, { userAgent, ipAddress }),
  ]);

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
  if (tenant && !ACTIVE_TENANT_STATUSES.includes(tenant.status)) throw ApiError.unauthorized("Organization unavailable");
  const tokens = await issueTokens(user, tenant, { userAgent, ipAddress });
  return { tokens, user, tenant };
}

/** Revoke a refresh token (logout). */
async function logout(refreshToken) {
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
}

/**
 * Self-service signup creates an isolated trial tenant and its first owner.
 * Public registration must never create a tenantless platform administrator.
 */
async function signup({ email, password, name, phone, businessName, industry, userAgent, ipAddress }) {
  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  // Hashing (the expensive bit) and slug allocation are independent — run together.
  const [passwordHash, slug] = await Promise.all([hashPassword(password), uniqueTenantSlug(businessName)]);

  const tenant = await Tenant.create({
    slug,
    name: businessName,
    industry,
    plan: "TRIAL",
    status: "TRIAL",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  let role;
  let user;
  try {
    const owner = SYSTEM_ROLES.find((item) => item.slug === "owner");
    // Role and user are independent of each other; only the membership needs both.
    [role, user] = await Promise.all([
      TenantRole.create({ tenantId: tenant._id, ...owner }),
      User.create({ email: normalizedEmail, passwordHash, name, phone, role: "SUPER_ADMIN", status: "ACTIVE", tenantId: tenant._id }),
    ]);
    await TenantUser.create({ tenantId: tenant._id, userId: user._id, roleId: role._id });
  } catch (error) {
    if (user) await User.deleteOne({ _id: user._id });
    if (role) await TenantRole.deleteOne({ _id: role._id });
    await Tenant.deleteOne({ _id: tenant._id });
    throw error;
  }

  const tokens = await issueTokens(user, tenant, { userAgent, ipAddress });
  return {
    tokens,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, industry: tenant.industry, plan: tenant.plan, status: tenant.status },
  };
}

/**
 * Try a one-time recovery code. On success the code is consumed (removed from
 * the stored hashes) so it cannot be replayed.
 */
async function consumeRecoveryCode(user, code) {
  const codes = user.twoFactorRecoveryCodes || [];
  if (!codes.length || !code) return false;
  const normalized = String(code).replace(/[\s-]/g, "").toUpperCase();
  for (let i = 0; i < codes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await verifyPassword(normalized, codes[i])) {
      const remaining = codes.slice();
      remaining.splice(i, 1);
      await User.updateOne({ _id: user._id }, { $set: { twoFactorRecoveryCodes: remaining } });
      return true;
    }
  }
  return false;
}

/** Whether 2FA is enabled for a user. */
async function twoFactorStatus(userId) {
  const user = await User.findById(userId).select("twoFactorEnabled").lean();
  return { enabled: !!(user && user.twoFactorEnabled) };
}

/** Start enrollment: issue a pending secret + provisioning URI (not yet active). */
async function beginTwoFactorSetup(user) {
  const secret = generateSecret();
  await User.updateOne({ _id: user._id }, { $set: { twoFactorPendingSecret: secret } });
  return { secret, otpauthUrl: keyUri({ secret, label: user.email, issuer: "NexusSoft" }) };
}

/** Confirm enrollment with the first valid code; returns one-time recovery codes. */
async function enableTwoFactor(user, code) {
  const doc = await User.findById(user._id).select("+twoFactorPendingSecret");
  if (!doc || !doc.twoFactorPendingSecret) throw ApiError.badRequest("Start two-factor setup first");
  if (!verifyTotp(doc.twoFactorPendingSecret, code)) throw ApiError.badRequest("Invalid authentication code");

  const recoveryCodes = Array.from({ length: 8 }, () => randomCode(10));
  const hashed = await Promise.all(recoveryCodes.map((c) => hashPassword(c)));
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        twoFactorEnabled: true,
        twoFactorSecret: doc.twoFactorPendingSecret,
        twoFactorRecoveryCodes: hashed,
      },
      $unset: { twoFactorPendingSecret: 1 },
    }
  );
  return { recoveryCodes };
}

/** Disable 2FA after verifying the current code (TOTP or a recovery code). */
async function disableTwoFactor(user, code) {
  const doc = await User.findById(user._id).select("+twoFactorSecret +twoFactorRecoveryCodes");
  if (!doc || !doc.twoFactorEnabled) return { disabled: true };

  const valid = verifyTotp(doc.twoFactorSecret, code) || (await consumeRecoveryCode(doc, code));
  if (!valid) throw ApiError.badRequest("Invalid authentication code");

  await User.updateOne(
    { _id: user._id },
    {
      $set: { twoFactorEnabled: false },
      $unset: { twoFactorSecret: 1, twoFactorPendingSecret: 1, twoFactorRecoveryCodes: 1 },
    }
  );
  return { disabled: true };
}

module.exports = {
  login,
  refresh,
  logout,
  signup,
  issueTokens,
  twoFactorStatus,
  beginTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
};
