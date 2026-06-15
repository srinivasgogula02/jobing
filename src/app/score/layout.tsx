import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

// Readiness brand fonts, scoped to /score only (DESIGN.md typography).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI-Readiness Score — Is AI Coming for Your First Job? | Jobing",
  description:
    "Take the free 2-minute AI-Readiness assessment for final-year engineers. Get your personalised score, skill gaps, and 2026 fresher hiring role path — no login required.",
  keywords: [
    "AI Readiness Score",
    "AI job readiness quiz",
    "fresher hiring 2026",
    "AI replacing jobs",
    "engineering placement test",
    "career readiness assessment",
    "skill gap analysis",
    "Jobing AI",
  ],
  alternates: {
    canonical: "https://jobing.site/score",
  },
  openGraph: {
    title: "AI-Readiness Score — Is AI Coming for Your First Job?",
    description:
      "Answer 9 questions. See your AI-Readiness Score, your skill gaps, and your next role path for 2026 fresher hiring.",
    url: "https://jobing.site/score",
    siteName: "Jobing AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI-Readiness Score by Jobing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Readiness Score — Is AI Coming for Your First Job?",
    description:
      "Free 2-min quiz for final-year engineers. Get your AI-Readiness Score and personalised role path.",
    images: ["/og-image.png"],
    creator: "@jobing_ai",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0E1219",
};

export default function ScoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      {children}
    </div>
  );
}
