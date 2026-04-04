import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/strategy/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/api/backtest/:path*",
        destination: "http://localhost:8002/api/:path*",
      },
      {
        source: "/api/mcp/:path*",
        destination: "http://localhost:3846/:path*",
      },
    ];
  },
};

export default nextConfig;
