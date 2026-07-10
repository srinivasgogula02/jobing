/**
 * /llms.txt — discovery manifest for AI agents (the AEO equivalent of
 * sitemap.xml). Points crawlers at the markdown twins of our key pages and every
 * published blog post. Regenerated hourly so new posts show up automatically.
 */
import { createLlmsTxtHandler } from "@dualmark/nextjs";
import type { LlmsTxtSection } from "@dualmark/core";
import { SITE_URL } from "@/lib/dualmark";
import { getPublishedBlogs } from "@/app/actions/blog";

export const dynamic = "force-static";
export const revalidate = 3600;

const md = (path: string) => `${SITE_URL}${path}.md`;

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogs>> = [];
  try {
    posts = await getPublishedBlogs();
  } catch {
    posts = [];
  }

  const sections: LlmsTxtSection[] = [
    {
      title: "Key Pages",
      description: "Core product and information pages.",
      links: [
        { title: "Home", href: md("/index"), description: "What Jobing AI does." },
        { title: "Tools", href: md("/tools"), description: "Free AI career tools." },
        { title: "Pricing", href: md("/pricing"), description: "Plans and pricing." },
        { title: "About", href: md("/about"), description: "Mission and vision." },
      ],
    },
    {
      title: "Legal",
      links: [
        { title: "Privacy Policy", href: md("/privacy") },
        { title: "Terms & Conditions", href: md("/terms") },
      ],
    },
  ];

  if (posts.length > 0) {
    sections.push({
      title: "Blog",
      description: "Resume, ATS, and job-search strategy articles.",
      links: [
        { title: "All articles", href: md("/blog") },
        ...posts.map((p) => ({
          title: p.title,
          href: md(`/blog/${p.permalink}`),
          description: p.description,
        })),
      ],
    });
  }

  return createLlmsTxtHandler({
    brandName: "Jobing AI",
    description:
      "Jobing AI builds fast, focused web tools for sharing notes, previewing HTML, and getting everyday work done.",
    sections,
    cacheControl: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  }).GET();
}
