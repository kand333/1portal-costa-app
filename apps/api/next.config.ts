import type { NextConfig } from "next";

// Backend app: only exposes REST Route Handlers under /api/**.
const nextConfig: NextConfig = {
  // Do not let `next dev` append generated rules to the project's CLAUDE.md.
  agentRules: false,
  transpilePackages: ["@portal/shared"],
};

export default nextConfig;
