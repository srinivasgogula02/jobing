#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env file
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DIAGRAM =
  "https://ugdrybcvyucwhuoyykfg.supabase.co/storage/v1/object/public/images/aeo-infrastructure.png";

const blogPost = {
  title: "AEO Infrastructure: How jobing.site Gets Cited by ChatGPT, Claude & Perplexity",
  description:
    "Your page ranks #1 on Google, but ChatGPT cites your competitor. That's not a content problem — it's an infrastructure problem. Here's the AEO setup we built into jobing.site: a markdown twin for every page, served by HTTP content negotiation, so AI engines can actually read and cite us.",
  image_url: DIAGRAM,
  keywords:
    "AEO, AI Engine Optimization, Answer Engine Optimization, DualMark, markdown twins, llms.txt, content negotiation, ChatGPT SEO, get cited by AI, Next.js AEO",
  permalink: "aeo-infrastructure",
  published: true,
  content: `# AEO Infrastructure: How jobing.site Gets Cited by ChatGPT, Claude & Perplexity

Here's an uncomfortable truth about 2026: ranking #1 on Google is no longer the finish line. More and more people don't *search* anymore — they *ask*. They ask ChatGPT, Claude, Perplexity, and Gemini. And those engines don't show ten blue links. They give one answer, and they cite a handful of sources.

So a new failure mode has appeared, and it's brutal:

> Your blog ranks #1 on Google. ChatGPT cites your competitor. That's an infrastructure problem.

This is the problem **AEO — AI Engine Optimization** — exists to solve. SEO gets you ranked for humans. AEO gets you *read and cited* by machines. They are not the same job, and the second one is mostly an infrastructure problem, not a content one.

Here's exactly how we solved it for **jobing.site**.

## Why AI engines choke on a normal website

When Googlebot crawls you, it renders a full browser. When an AI crawler fetches you, it usually doesn't. It grabs the raw HTML and tries to make sense of it. And a modern marketing page is a hostile environment for that:

- Navigation bars, mega-menus, and footers wrapped around the actual content
- JavaScript that never executes, so half the page is empty
- Cookie banners, modals, and consent walls
- Auth redirects that bounce bots to a sign-in page before they ever see the article

The model has to dig your three useful paragraphs out of two thousand lines of \`<div>\`s. Often it just… doesn't. Your content is *technically* online and *practically* invisible to the systems that are increasingly the front door to your product.

## The fix: give every page a markdown twin

The clean solution is **HTTP content negotiation** — the same idea the web has used for decades to serve different languages or formats from one URL.

The trick: every public page gets a **markdown twin** at the *same URL*. Humans asking for HTML get the full, designed page. AI crawlers (or anything sending \`Accept: text/markdown\`, or hitting the URL with a \`.md\` suffix) get clean, structured markdown — no chrome, no JavaScript, no cookie banner. Just the content, in the exact format LLMs read most reliably.

Same URL. Two representations. The right one for whoever is asking.

We didn't hand-roll this. We use [DualMark](https://dualmark.dev), an open-source AEO layer, via its \`@dualmark/nextjs\` package. Here's the architecture running on jobing.site today:

![AEO infrastructure for jobing.site — DualMark gives every page a markdown twin, picked by HTTP content negotiation. Human browsers get the full HTML site; AI crawlers get clean markdown at the same URL.](${DIAGRAM})

## Walking through the diagram

Follow the two paths in the diagram and you've understood the whole system.

**1. A request comes in — human or AI.** A person on Chrome and an AI crawler from ChatGPT, Claude, Perplexity, or Gemini both hit the *same* URL.

**2. Middleware negotiates.** Our \`middleware.ts\` runs \`createDualmarkMiddleware\` *first*, before anything else. It inspects the request:

- If the path ends in \`.md\`, rewrite it to the \`/md/<path>\` namespace.
- If the \`Accept\` header asks for markdown, or the User-Agent matches a known AI bot, route it to the markdown twin.
- Otherwise, let the normal HTML page render — and tag the response with a \`Link: <…>; rel="alternate"; type="text/markdown"\` header so crawlers can *discover* the twin, plus \`Vary: Accept\` so caches don't mix the two up.

**3a. Humans get the full site.** \`Accept: text/html\` flows straight to the normal Next.js page — nav, styling, interactivity, everything. Nothing about the human experience changes.

**3b. AI gets clean markdown.** The \`/md/[...path]\` route handler (\`createDualmarkRouteHandler\`) renders a pristine markdown version of the *same content* — same URL, no chrome, no JavaScript. That's what lands in the model's context window, and that's what it cites.

**4. The bonus: \`/llms.txt\`.** We also publish a clean index of the site's pages for AI at [/llms.txt](https://jobing.site/llms.txt) — think \`robots.txt\`, but a welcome mat for language models instead of a fence. It tells an agent what exists and where to read it.

The payoff is the bottom-right of the diagram: **cited in AI answers → traffic and signups back to jobing.site.**

## The detail that actually matters: run it *before* auth

The single most important implementation decision: DualMark runs **before** our Clerk authentication checks.

Most of our app sits behind auth. If a bot hits a page and gets bounced to a sign-in wall, your markdown twin is worthless — the crawler indexes a login form. So in our middleware, content negotiation happens at the very top. \`.md\` requests and known AI user-agents are served clean markdown *before* any auth logic can redirect them. Public marketing, blog, tools, and legal pages all get twins; the genuinely private app surfaces are explicitly skipped.

A few other things we got right that are easy to get wrong:

- **Only negotiate real document requests.** We skip Next.js's internal RSC navigations and prefetches (they send \`Accept: text/x-component\`). Negotiating those would 406 and break client-side navigation for humans.
- **Mark the twins \`noindex\`.** The markdown is a duplicate of canonical HTML. We let AI crawlers read it, but keep it out of Google's index to avoid duplicate-content confusion.
- **Twins for dynamic content too.** Our blog (this very post included) is database-backed. DualMark generates a markdown twin for every published post automatically through a "collection," so the AEO layer scales with our content instead of needing a hand-written file per page.

## Setting it up is genuinely a 30-second job

The reason there's no excuse to skip this: the integration is tiny. On Next.js it's three packages and a wrapper:

\`\`\`ts
// next.config.ts
import { withDualmark } from "@dualmark/nextjs";

export default withDualmark(nextConfig, {
  siteUrl: "https://jobing.site",
});
\`\`\`

…then compose \`createDualmarkMiddleware\` into your \`middleware.ts\`, drop in the \`/md/[...path]\` route handler, and you're negotiating. DualMark even ships a \`dualmark verify\` command that scores your conformance so you can see exactly how readable you are to machines. (We score in the 110–125 range; edge caches stripping the \`Vary\` header on prerendered routes cost a few points in production, which is expected.)

## Why we bothered

Look at where our own audience already is. We see referral traffic from \`chatgpt.com\` in our analytics *today*. People are discovering tools through AI assistants right now — not in some speculative future. Every page we publish without a markdown twin is a page we're hiding from the fastest-growing discovery channel on the internet.

SEO is table stakes. AEO is the new edge. The infrastructure to win it is small, open-source, and mostly a one-time setup — and the sites that put it in now are the ones AI will be citing for years.

If you're building anything you want discovered in 2026, give your pages a markdown twin. Your future readers aren't all human anymore.

*Curious what our clean version looks like? Add \`.md\` to the end of this article's URL and read exactly what ChatGPT sees.*`,
};

async function publishBlog() {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .upsert([blogPost], { onConflict: "permalink" })
      .select();

    if (error) {
      console.error("Error publishing blog:", error.message);
      process.exit(1);
    }

    console.log("✅ AEO blog published successfully!");
    console.log("Title:", data[0].title);
    console.log("URL: /blog/" + data[0].permalink);
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

publishBlog();
