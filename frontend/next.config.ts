import type { NextConfig } from "next";

// The Express + MongoDB backend now owns all data APIs. The frontend keeps
// calling same-origin `/api/*` (so cookies "just work"); these rewrites proxy
// those calls to the backend. Set BACKEND_URL in .env (defaults to :4000).
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
