import type { NextConfig } from "next";
import path from "path";

const strategyHost = process.env.STRATEGY_API_HOST ?? "localhost";
const backtestHost = process.env.BACKTEST_API_HOST ?? "localhost";
const mcpHost = process.env.MCP_API_HOST ?? "localhost";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/strategy/:path*",
        destination: `http://${strategyHost}:8000/api/:path*`,
      },
      {
        source: "/api/backtest/:path*",
        destination: `http://${backtestHost}:8002/api/:path*`,
      },
      {
        source: "/api/mcp/:path*",
        destination: `http://${mcpHost}:3846/:path*`,
      },
    ];
  },
};

export default nextConfig;
