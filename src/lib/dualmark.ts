/**
 * DualMark AEO (AI Engine Optimization) configuration for Jobing AI.
 *
 * DualMark serves a clean Markdown "twin" of every public page so AI assistants
 * (ChatGPT, Claude, Perplexity, Gemini, …) can read and cite our content the way
 * humans read the rendered HTML. The same config object drives three things:
 *
 *   1. The `/md/[...path]` route handler (the markdown endpoint).
 *   2. The DualMark middleware logic, composed into our Clerk middleware
 *      (`src/middleware.ts`) — it intercepts `.md` requests and known AI bots
 *      *before* auth so they never hit a sign-in wall.
 *   3. `/llms.txt`, the discovery manifest for AI agents.
 *
 * Keep this file as the single source of truth: add a page here and its markdown
 * twin, sitemap-style discovery, and bot negotiation all light up at once.
 */
import type { DualmarkNextConfig } from "@dualmark/nextjs";
import { toMarkdownPath } from "@dualmark/core";
import { getPublishedBlogs } from "@/app/actions/blog";
import { getPublishedDailyUpdates } from "@/app/actions/daily-updates";

/** Public origin, no trailing slash. Override locally with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site"
).replace(/\/+$/, "");

const AUTHOR = "Srinivas Gogula";

// ─── Static page markdown twins ───────────────────────────────────────────────
// Hand-authored markdown for the public marketing / legal pages. These mirror the
// rendered HTML routes; the middleware advertises each via a Link: rel=alternate
// header and serves them at `<pattern>.md`.

function renderHome(): string {
  return `# Jobing AI — Your AI Job-Hunting Agent

> Don't let them take your job. Automate your job hunt with AI.

Jobing AI deploys a personal AI agent that finds jobs, writes hyper-customized,
ATS-beating resumes for every role, and emails recruiters and hiring managers
directly on your behalf — while you sleep.

## What the agent does

- **Finds matching jobs.** Scrapes and surfaces roles that fit your profile.
- **Tailors every resume.** Drafts a hyper-customized, ATS-optimized resume for
  each individual role, beating Applicant Tracking System filters.
- **Reaches out for you.** Emails recruiters and hiring managers directly on your
  behalf.
- **Keeps you in the loop.** Sends daily summaries of applications and replies.

## Why it works

Most job seekers send hundreds of manual applications and get ghosted. Jobing AI
runs the repetitive outreach end-to-end so you can focus on interviews instead of
copy-pasting cover letters.

## Pricing

Less than your Netflix subscription — starting around ₹249/month. Instant access,
cancel anytime. See [Pricing](${SITE_URL}/pricing).

## Explore

- [Free Tools](${SITE_URL}/tools) — Jobing Clipboard, ATS Resume Tailor, and more
- [Upskill](${SITE_URL}/upskill) — daily AI-powered career updates
- [Blog](${SITE_URL}/blog) — resume, ATS, and job-search strategy
- [About](${SITE_URL}/about) · [Pricing](${SITE_URL}/pricing)
`;
}

function renderAbout(): string {
  return `# About Jobing AI

## Our Mission

We started Jobing AI with a single goal: to make professional resume building
accessible, intelligent, and highly effective for everyone. In today's
competitive market your resume needs to do more than list experience — it has to
tell a compelling story that resonates with both AI filters and human recruiters.
Jobing AI uses the latest advances in artificial intelligence to bridge that gap.

## Our Vision

We envision a future where your skills and potential are never overlooked due to
poor formatting or missing keywords. We're building the most intuitive and
powerful AI career assistant to empower job seekers at every stage of their
journey.

## Why Jobing AI?

- **ATS-optimized output** that gets past automated screeners.
- **AI tailoring** for every single role you apply to.
- **Automated outreach** to recruiters and hiring managers.
- **Daily summaries** so you always know where your applications stand.

## Contact

Questions or partnerships: reach out via [jobing.site](${SITE_URL}).
`;
}

function renderPricing(): string {
  return `# Jobing AI Pricing

Less than your Netflix subscription. Instant access, cancel anytime.

## What you get

Deploy your own AI agent that:

- Finds jobs matched to your profile
- Writes customized, ATS-beating resumes for every role
- Emails recruiters and hiring managers on your behalf
- Sends you daily summaries of progress

Pricing starts around **₹249/month**. For current plans and checkout, visit
[${SITE_URL}/pricing](${SITE_URL}/pricing).

> "₹249/month to literally have an AI agent act as my personal hiring manager?
> Absolute no-brainer."
`;
}

function renderTools(): string {
  return `# Free AI Career & Productivity Tools

A suite of free, high-performance micro-tools by Jobing AI to accelerate your
career and daily workflow. No login required for standard tools.

## Tools

- **ATS Resume Tailor** — paste a job description and get a hyper-customized,
  ATS-optimized resume drafted for that exact role.
- **Jobing Clipboard** — a fast, shareable online clipboard / stealth notes for
  moving text between devices.
- **Resume Builder** — build a professional resume from scratch or by importing
  an existing one.

Explore everything at [${SITE_URL}/tools](${SITE_URL}/tools).

## Related

- [Upskill — daily career updates](${SITE_URL}/upskill)
- [Blog — resume & job-search strategy](${SITE_URL}/blog)
`;
}

async function renderUpskill(): Promise<string> {
  let recent: Awaited<ReturnType<typeof getPublishedDailyUpdates>> = [];
  try {
    recent = await getPublishedDailyUpdates();
  } catch {
    recent = [];
  }

  const list = recent
    .slice(0, 15)
    .map((u) => {
      const date = new Date(u.created_at).toISOString().slice(0, 10);
      const meta = [u.category, u.difficulty].filter(Boolean).join(" · ");
      const suffix = meta ? ` _(${meta})_` : "";
      return `- **${u.title}** — ${u.description} _(${date})_${suffix}`;
    })
    .join("\n");

  return `# Upskill — Daily AI Career Updates

Level up your career with daily, AI-powered insights on resume optimization, job
search strategy, ATS, interviews, and industry trends.

${list || "_Fresh updates are published daily — check back soon._"}

Read the latest at [${SITE_URL}/upskill](${SITE_URL}/upskill).
`;
}

function renderOnlineNotepad(): string {
  return `# Online Notepad — Free, Fast, No Login

Jobing's online notepad is a free, instantly-loading text editor. Open a blank
page, write or paste up to 100,000 characters, and save it to a shareable short
link like ${SITE_URL}/c/my-notes. No account, no installation, works on every
device.

## Key features

- **Instant load** — the editor is the page; start typing immediately.
- **Custom short links** — rename any note to a memorable URL (e.g. /c/homework).
- **Built-in clipboard** — copy the note's text or link with one tap.
- **Cross-device** — open a saved note from any browser, anywhere.
- **Private stealth links** — swap /c/ for /p/ for a low-key share page.

## How it works

1. Open the notepad at [${SITE_URL}/copy](${SITE_URL}/copy).
2. Write or paste your text.
3. Hit Create Share to get a link, optionally with a custom name.

Free, no sign-up required. Try it at [${SITE_URL}/online-notepad](${SITE_URL}/online-notepad).
`;
}

function renderOnlineClipboard(): string {
  return `# Online Clipboard — Copy & Share Text Across Devices

Jobing's online clipboard lets you copy text on one device and paste it on
another by opening a shared short link. It's a free cloud clipboard — no account,
nothing to install — that doubles as an online notepad.

## Key features

- **Copy & paste anywhere** — paste on one device, open the link on another.
- **One-tap share link** — saving and sharing your clipboard is the same action.
- **Phone ↔ laptop** — move a URL or snippet between your devices in seconds.
- **Private mode** — use a /p/ stealth link when it isn't for everyone.
- **Fast** — holds up to 100,000 characters and opens instantly.

## How it works

1. Open the clipboard at [${SITE_URL}/copy](${SITE_URL}/copy).
2. Paste your text and hit Create Share to get a short link.
3. Open that link on any other device and tap Copy.

Free, no login. Try it at [${SITE_URL}/online-clipboard](${SITE_URL}/online-clipboard).
`;
}

function renderShareText(): string {
  return `# Share Text Online — Instant Link for Any Text

Jobing lets you share text online by turning any block of text into a clean short
link like ${SITE_URL}/c/notes. Paste, share, done — no login, no app, no friction.

## Key features

- **Instant share link** — paste your text and get a short URL in one tap.
- **Editable & reusable** — update the note and the same link stays current.
- **Memorable custom URLs** — rename links to something like /c/wifi.
- **Any device** — recipients need nothing installed; it opens in their browser.
- **Private option** — share a /p/ stealth link for discretion.

## How it works

1. Open the editor at [${SITE_URL}/copy](${SITE_URL}/copy).
2. Paste your text and hit Create Share.
3. Copy the link and send it anywhere.

Free, no account needed. Try it at [${SITE_URL}/share-text](${SITE_URL}/share-text).
`;
}

function renderPrivacy(): string {
  return `# Privacy Policy

_Last updated: March 27, 2026_

Your privacy is of utmost importance to us. This policy explains how Jobing AI
collects, uses, and protects your personal information.

## Information We Collect

- **Account data** — via Clerk authentication: email, name, and profile picture.
- **Profile information** — the professional background you provide (education,
  experience, skills) stored securely in our Supabase database.
- **LinkedIn data** — if you use LinkedIn Import, we temporarily process your
  public profile data to populate your Jobing AI profile. We do not store your
  LinkedIn credentials.

## How We Use Your Data

- To provide and maintain our AI-powered resume building service.
- To tailor resume content to your background and target job descriptions.
- To provide support and notify you of important service updates.
- To improve our models and experience using anonymized, aggregated data.

## AI Processing

Your data may be processed by third-party large language models to generate and
tailor content. We work with providers that meet industry security standards.

For the full policy, see [${SITE_URL}/privacy](${SITE_URL}/privacy).
`;
}

function renderTerms(): string {
  return `# Terms & Conditions

_Last updated: March 27, 2026_

By accessing or using Jobing AI ("the Service") you agree to be bound by these
Terms. If you do not agree, do not use the Service.

## Description of Service

Jobing AI provides an AI-powered platform for building and tailoring professional
resumes, using large language models to analyze your data and generate content
based on target job descriptions.

## AI Disclaimer & Accuracy

Content generated by Jobing AI is produced by artificial intelligence. While we
strive for accuracy, AI can occasionally produce incorrect, biased, or incomplete
information. It is your responsibility to review, verify, and edit any generated
content before using it for job applications.

## User Obligations

- Provide accurate, truthful information about your background.
- Do not use the Service for any illegal or unauthorized purpose.
- Keep your account credentials secure.
- Do not reverse engineer or attempt to bypass AI safety filters.

For the full terms, see [${SITE_URL}/terms](${SITE_URL}/terms).
`;
}

// ─── DualMark config ──────────────────────────────────────────────────────────

export const dualmarkConfig: DualmarkNextConfig = {
  siteUrl: SITE_URL,
  internalNamespace: "md",

  collections: {
    // Supabase-backed blog. Each published post gets a markdown twin at
    // /blog/<permalink>.md, plus a /blog.md listing.
    blog: {
      converter: "blog",
      slugStrategy: "single",
      listingMetadata: {
        title: "Jobing AI Blog",
        description:
          "Resume tips, ATS optimization, and job-search strategy from Jobing AI.",
      },
      getEntries: async () => {
        const posts = await getPublishedBlogs();
        return posts.map((p) => ({
          id: p.permalink,
          body: p.content,
          data: {
            title: p.title,
            description: p.description,
            author: AUTHOR,
            publishedDate: new Date(p.created_at),
            category: p.keywords
              ? p.keywords.split(",")[0]?.trim()
              : undefined,
          },
        }));
      },
    },
  },

  staticPages: [
    { pattern: "/", render: renderHome },
    { pattern: "/about", render: renderAbout },
    { pattern: "/pricing", render: renderPricing },
    { pattern: "/tools", render: renderTools },
    { pattern: "/online-notepad", render: renderOnlineNotepad },
    { pattern: "/online-clipboard", render: renderOnlineClipboard },
    { pattern: "/share-text", render: renderShareText },
    { pattern: "/upskill", render: renderUpskill },
    { pattern: "/privacy", render: renderPrivacy },
    { pattern: "/terms", render: renderTerms },
  ],

  // We inject the alternate Link header ourselves in src/middleware.ts so we only
  // advertise twins that actually exist (see hasMarkdownTwin below).
  middleware: {
    injectLinkHeader: false,
    // Paths the negotiator must never rewrite to /md: APIs, auth, and the
    // authenticated app surfaces that have no public markdown twin.
    skipPaths: [
      "/api",
      "/sign-in",
      "/sign-up",
      "/billing",
      "/create",
      "/edit",
      "/profile",
      "/resumes",
      "/copy",
      "/c",
      "/p",
      "/pages",
    ],
  },

  headers: {
    cacheControl: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    // Markdown twins are duplicates of canonical HTML — keep them out of the
    // search index while still letting AI crawlers read them.
    noindex: true,
  },
};

// ─── Twin-awareness helpers (used by middleware) ──────────────────────────────

const STATIC_TWIN_PATHS = new Set(
  dualmarkConfig.staticPages?.map((p) => p.pattern) ?? [],
);

/** Does `pathname` have a markdown twin we actually serve? */
export function hasMarkdownTwin(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (STATIC_TWIN_PATHS.has(clean)) return true;
  if (clean === "/blog") return true; // listing twin
  if (/^\/blog\/[^/]+$/.test(clean)) return true; // post twins
  return false;
}

/** Public URL of the markdown twin for an HTML path (e.g. /about -> /about.md). */
export function markdownTwinPath(pathname: string): string {
  return toMarkdownPath(pathname);
}
