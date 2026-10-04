import type { NextConfig } from "next";

// Backend (@portal/api) reachable from this server. Rewrites are resolved at build time.
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Do not let `next dev` append generated rules to the project's CLAUDE.md.
  agentRules: false,
  transpilePackages: ["@portal/shared"],
  images: {
    remotePatterns: [
      // Placeholder photos used by the development seed (apps/api/prisma/seed/images.ts).
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Images uploaded by ADMIN (stored in Cloudinary, step 26).
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  // The browser only talks to this origin: /api/** is proxied to the backend,
  // so session cookies stay first-party and no CORS is needed.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiInternalUrl}/api/:path*` }];
  },
};

export default nextConfig;
