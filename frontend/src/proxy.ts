import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { verifyAccessToken, type TokenPayload } from "@/lib/auth";

/**
 * Ask the backend for a fresh token pair using the refresh-token cookie.
 * Returns the raw `Set-Cookie` header values to forward to the browser, or
 * null when the refresh token is missing/revoked/expired.
 */
async function refreshSession(request: NextRequest, refreshTokenValue: string): Promise<string[] | null> {
  try {
    const refreshResponse = await fetch(new URL("/api/auth/refresh", request.url), {
      method: "POST",
      headers: {
        "Cookie": `refresh_token=${refreshTokenValue}`,
        "User-Agent": request.headers.get("user-agent") || "",
      },
    });

    if (!refreshResponse.ok) return null;

    const headers = refreshResponse.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = headers.getSetCookie?.() ?? [];
    if (cookies.length) return cookies;

    const single = refreshResponse.headers.get("set-cookie");
    return single ? [single] : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and API auth routes
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/solutions",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/careers",
    "/case-studies",
    "/demo",
    "/faq",
    "/privacy-policy",
    "/support",
    "/terms",
    "/why-choose-us",
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/logout",
  ];

  // Check if the path is a solution sub-page (public)
  const isSolutionPage = pathname.startsWith("/solutions/");

  // The member self-service portal uses its own client-side JWT (Bearer token in
  // localStorage), not the staff access_token cookie — so it is public to this
  // staff middleware and guards itself.
  const isMemberPortal = pathname === "/portal" || pathname.startsWith("/portal/");
  const isMemberPortalApi = pathname === "/api/gym/portal" || pathname.startsWith("/api/gym/portal/");

  // Check if the path is a static file or Next.js internal
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") === false && pathname.includes(".");

  if (publicPaths.includes(pathname) || isSolutionPage || isMemberPortal || isMemberPortalApi || isStaticFile) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshTokenValue = request.cookies.get("refresh_token")?.value;

  const redirectToLogin = () => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  };

  // No session cookies at all → the user is genuinely signed out.
  if (!accessToken && !refreshTokenValue) {
    return isApi ? NextResponse.json({ error: "Not authenticated" }, { status: 401 }) : redirectToLogin();
  }

  // Verify the signature when possible, but fall back to decoding the claims
  // without verification. The backend is the source of truth and re-validates
  // every token, so a local JWT_SECRET mismatch must never evict a user who
  // holds a valid backend-issued cookie.
  let payload: (TokenPayload & { exp?: number }) | null = accessToken
    ? await verifyAccessToken(accessToken)
    : null;
  if (!payload && accessToken) {
    try {
      payload = decodeJwt(accessToken) as unknown as TokenPayload & { exp?: number };
    } catch {
      payload = null;
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = !payload || (typeof payload.exp === "number" && payload.exp <= nowSec);

  if (isExpired) {
    // API calls are left to the client, which silently refreshes then retries;
    // this avoids turning a data request into a redirect.
    if (isApi) return NextResponse.next();

    // Page load with an expired session → refresh once, then continue.
    if (refreshTokenValue) {
      const cookies = await refreshSession(request, refreshTokenValue);
      if (cookies) {
        const redirectResponse = NextResponse.redirect(
          new URL(`${pathname}${request.nextUrl.search}`, request.url)
        );
        cookies.forEach((cookie) => redirectResponse.headers.append("Set-Cookie", cookie));
        return redirectResponse;
      }
    }

    return redirectToLogin();
  }

  const authPayload = payload as TokenPayload;

  // Admin route protection — only platform super admins (no tenant) can access admin
  if (pathname.startsWith("/admin")) {
    if (authPayload.role !== "SUPER_ADMIN" || authPayload.tenantId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Dashboard route protection — tenant users only (admins without tenant go to /admin)
  if (pathname.startsWith("/dashboard") && !isApi) {
    if (authPayload.role === "SUPER_ADMIN" && !authPayload.tenantId) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", authPayload.userId);
  response.headers.set("x-user-email", authPayload.email);
  response.headers.set("x-user-role", authPayload.role);
  if (authPayload.tenantId) {
    response.headers.set("x-tenant-id", authPayload.tenantId);
  }
  if (authPayload.tenantSlug) {
    response.headers.set("x-tenant-slug", authPayload.tenantSlug);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
