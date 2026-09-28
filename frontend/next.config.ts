import type { NextConfig } from "next";

// The Express + MongoDB backend owns the data APIs. Keep browser calls same-origin
// so the auth cookies are forwarded through the Next.js proxy.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
if (process.env.VERCEL && !process.env.BACKEND_URL) throw new Error("BACKEND_URL must be configured on Vercel");

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
