import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "nexussoft-dev-secret-change-in-production");
if (!jwtSecret) throw new Error("JWT_SECRET must be configured in production");
const JWT_SECRET = new TextEncoder().encode(jwtSecret);

// ═══════════════════════════════════════════════════════════
//   PASSWORD HASHING
// ═══════════════════════════════════════════════════════════

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════
//   JWT TOKENS
// ═══════════════════════════════════════════════════════════

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  tenantSlug?: string;
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // 15 minutes
    .setIssuer("nexussoft")
    .setAudience("nexussoft-api")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days
    .setIssuer("nexussoft")
    .setAudience("nexussoft-refresh")
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "nexussoft",
      audience: "nexussoft-api",
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "nexussoft",
      audience: "nexussoft-refresh",
    });
    return payload as unknown as { userId: string };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
//   COOKIE HELPERS
// ═══════════════════════════════════════════════════════════

import { cookies } from "next/headers";

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

export async function getTokensFromCookies() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  return { accessToken, refreshToken };
}
