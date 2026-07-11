import type { NextConfig } from "next";
import { withDualmark } from "@dualmark/nextjs";

// AEO / DualMark: the public pages below each have a Markdown twin, and our
// middleware negotiates Markdown vs HTML based on the `Accept` request header, so
// these responses genuinely vary by `Accept`. AEO audits require `Vary: Accept`
// on both the HTML pages and the `/md` twins.
//
// Why this lives in next.config (not the middleware or the /md route handler):
// Next's App Router rewrites the `Vary` header to its own RSC tokens
// (`RSC, Next-Router-State-Tree, …`) at render time, clobbering any `Vary: Accept`
// we set in middleware or in the route handler's Response. `headers()` entries are
// compiled into the Vercel Build Output and applied at the edge network *after*
// the function returns, so they survive. (Note: a local `next start` applies them
// in-process where render still clobbers them — this only works as intended on
// Vercel's edge.)
//
// Keep this list in sync with `staticPages` + the blog collection in
// src/lib/dualmark.ts. We can't import that config here without pulling the
// server-action graph into next.config, so it's mirrored by hand.
const RSC_VARY =
  "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch";

// HTML pages with a twin: keep Next's RSC tokens (needed for correct RSC/prefetch
// cache keys) and add `Accept`.
const HTML_TWIN_SOURCES = [
  "/",
  "/about",
  "/pricing",
  "/tools",
  "/online-notepad",
  "/online-clipboard",
  "/share-text",
  "/upskill",
  "/privacy",
  "/terms",
  "/blog",
  "/blog/:permalink",
];

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
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
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      ...HTML_TWIN_SOURCES.map((source) => ({
        source,
        headers: [{ key: "Vary", value: `${RSC_VARY}, Accept` }],
      })),
      {
        // Markdown twins served by the DualMark route handler (no RSC payloads).
        source: "/md/:path*",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ];
  },
};

// withDualmark adds the DualMark packages to transpilePackages and validates the
// site URL at boot. We pass a minimal config here (the full AEO config lives in
// src/lib/dualmark.ts) to keep next.config decoupled from the server-action graph.
export default withDualmark(nextConfig, {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site").replace(/\/+$/, ""),
});
