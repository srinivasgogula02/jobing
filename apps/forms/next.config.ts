import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const formsRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  basePath: "/forms",
  poweredByHeader: false,
  // This repository intentionally has independent lockfiles for the main app
  // and Forms. Keep Turbopack and output tracing inside the Forms project root.
  outputFileTracingRoot: formsRoot,
  turbopack: {
    root: formsRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
        ],
      },
    ];
  },
};

export default nextConfig;
