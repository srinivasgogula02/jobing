import type { NextConfig } from "next";
import { withDualmark } from "@dualmark/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
};

// withDualmark adds the DualMark packages to transpilePackages and validates the
// site URL at boot. We pass a minimal config here (the full AEO config lives in
// src/lib/dualmark.ts) to keep next.config decoupled from the server-action graph.
export default withDualmark(nextConfig, {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site").replace(/\/+$/, ""),
});
