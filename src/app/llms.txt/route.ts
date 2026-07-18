/**
 * AI-agent discovery manifest. It points crawlers to current Markdown twins and
 * public product surfaces. Retired career-product content is excluded.
 */
import { createLlmsTxtHandler } from "@dualmark/nextjs";
import type { LlmsTxtSection } from "@dualmark/core";
import { SITE_URL } from "@/lib/dualmark";
import { getPublishedBlogIndex } from "@/app/actions/blog";

export const dynamic = "force-static";
export const revalidate = 3600;

const md = (path: string) => `${SITE_URL}${path}.md`;

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogIndex>> = [];
  try {
    posts = await getPublishedBlogIndex();
  } catch {
    posts = [];
  }

  const sections: LlmsTxtSection[] = [
    {
      title: "Jobing AI",
      description: "Current product, connector setup, plans, and company information.",
      links: [
        { title: "Home", href: md("/index"), description: "What Jobing AI is and what it can do today." },
        { title: "Connector guide", href: md("/connector"), description: "How to connect Jobing to a compatible AI app, permissions, and prompts." },
        { title: "Pricing", href: md("/pricing"), description: "Free, Starter, and Business allowances and limit behavior." },
        { title: "About", href: md("/about"), description: "Why Jobing exists and the principles behind the product." },
        { title: "Jobing Forms", href: "https://forms.jobing.site", description: "Custom forms, native website integration, response collection, and AI-assisted review." },
      ],
    },
    {
      title: "Jobing Guides",
      description: "Current articles about AI workflows, publishing, custom forms, product decisions, and building Jobing.",
      links: [
        { title: "All guides", href: md("/blog"), description: "Browse every current Jobing article." },
        ...posts.map((post) => ({
          title: post.title,
          href: md(`/blog/${post.permalink}`),
          description: post.description,
        })),
      ],
    },
    {
      title: "Free Utilities",
      description: "Focused public browser tools separate from the main connector workflow.",
      links: [
        { title: "All utilities", href: md("/tools"), description: "Jobing Clipboard, HTML Online Viewer, and LastMinute." },
        { title: "Online Notepad", href: md("/online-notepad"), description: "Write and share text through a short browser link." },
        { title: "Online Clipboard", href: md("/online-clipboard"), description: "Move text between devices through a short link." },
        { title: "Share Text", href: md("/share-text"), description: "Turn text into a shareable browser link." },
      ],
    },
    {
      title: "Legal",
      links: [
        { title: "Privacy Policy", href: md("/privacy") },
        { title: "Terms of Service", href: md("/terms") },
      ],
    },
  ];

  return createLlmsTxtHandler({
    brandName: "Jobing AI",
    description:
      "Jobing AI is one connector that lets a compatible AI app publish web pages, create custom forms, collect responses, and help the user work with those responses.",
    sections,
    cacheControl: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  }).GET();
}
