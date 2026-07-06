import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
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

  // Check if the path is a static file or Next.js internal
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") === false && pathname.includes(".");

  if (publicPaths.includes(pathname) || isSolutionPage || isMemberPortal || isStaticFile) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // Redirect to login for non-API routes
    if (!pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify token
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    // Token invalid — try silent refresh using the refresh token cookie
    const refreshTokenValue = request.cookies.get("refresh_token")?.value;
    if (refreshTokenValue) {
      try {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            "Cookie": `refresh_token=${refreshTokenValue}`,
            "User-Agent": request.headers.get("user-agent") || "",
          },
        });

        if (refreshResponse.ok) {
          // Refresh succeeded — extract new tokens from Set-Cookie headers
          const newCookies = refreshResponse.headers.get("set-cookie");
          if (newCookies) {
            const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));
            // Forward Set-Cookie headers from refresh response
            newCookies.split(",").forEach((cookie) => {
              redirectResponse.headers.append("Set-Cookie", cookie.trim());
            });
            return redirectResponse;
          }
        }
      } catch {
        // Refresh failed, fall through to redirect to login
      }
    }

    // Redirect to login for non-API routes
    if (!pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Admin route protection — only platform super admins (no tenant) can access admin
  if (pathname.startsWith("/admin")) {
    if (payload.role !== "SUPER_ADMIN" || payload.tenantId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Dashboard route protection — tenant users only (admins without tenant go to /admin)
  if (pathname.startsWith("/dashboard") && !pathname.startsWith("/api/")) {
    if (payload.role === "SUPER_ADMIN" && !payload.tenantId) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.userId);
  response.headers.set("x-user-email", payload.email);
  response.headers.set("x-user-role", payload.role);
  if (payload.tenantId) {
    response.headers.set("x-tenant-id", payload.tenantId);
  }
  if (payload.tenantSlug) {
    response.headers.set("x-tenant-slug", payload.tenantSlug);
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
