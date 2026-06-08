import { MetadataRoute } from "next";

/**
 * PWA manifest. The #1 problem in the analytics was near-zero retention: new users
 * (~7.6k) almost exactly equalled active users, and people who wanted to come back
 * re-Googled "jobing site copy" instead of bookmarking. Making the notepad an
 * installable app (Add to Home Screen) gives the loop a durable re-entry point.
 *
 * `start_url` points at /copy — the stickiest surface (highest engagement time) and
 * the one users actually return for — not the marketing homepage.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jobing — Notepad, Clipboard & Career Tools",
    short_name: "Jobing",
    description:
      "A radically fast, free online notepad and clipboard. Save, edit and share text across devices with custom short links — no login required.",
    start_url: "/copy",
    id: "/copy",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#C1FF00",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities", "education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "New Note",
        short_name: "New Note",
        description: "Open a fresh notepad",
        url: "/copy",
      },
      {
        name: "Career Tools",
        short_name: "Tools",
        description: "Resume builder and free tools",
        url: "/tools",
      },
    ],
  };
}
