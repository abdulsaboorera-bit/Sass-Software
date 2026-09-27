import type { NextConfig } from "next";

// The Express + MongoDB backend owns the data APIs. Keep browser calls same-origin
// so the auth cookies are forwarded through the Next.js proxy.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${BACKEND_URL}/api/:path*`,
    }];
  },
};

export default nextConfig;
