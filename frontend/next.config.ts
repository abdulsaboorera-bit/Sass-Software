import type { NextConfig } from "next";

// The Express + MongoDB backend owns the data APIs. Keep browser calls same-origin
// so the auth cookies are forwarded through the Next.js proxy.
const BACKEND_URL = process.env.BACKEND_URL || (process.env.VERCEL ? "https://sass-backend-ske8.onrender.com" : "http://localhost:4000");

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  compress: true,
  poweredByHeader: false,
  // Tree-shake icon/chart barrels so a page only ships the modules it imports.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Drop console noise from the production bundle (keep errors/warnings).
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${BACKEND_URL}/api/:path*`,
    }];
  },
};

export default nextConfig;
