// Plain (non-"use server") module for blog values/types that need to be imported
// by both the server actions and client/server components. A "use server" file may
// only export async functions, so shared constants like the page size live here.

// Default posts per listing page. 12 divides evenly across the 1/2/3/4-column
// responsive grid so pages always end on a clean row.
export const BLOG_PAGE_SIZE = 12;

// These articles belong to Jobing's retired career-product positioning. Keep
// the rows intact in Supabase for archival purposes, but do not advertise or
// serve them from the current Pages + Forms product.
export const RETIRED_BLOG_PERMALINKS = [
  "ai-job-market-2026",
  "how-to-defeat-ats",
  "improve-english-speaking-discord",
  "junior-developer-resume-mistakes",
] as const;

// Lightweight shape for the blog listing — deliberately excludes the heavy
// `content` column so the index page doesn't pull every post's full markdown.
export interface BlogListItem {
  id: string;
  created_at: string;
  title: string;
  description: string;
  image_url: string | null;
  keywords: string | null;
  permalink: string;
}

export function blogReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function blogCategory(item: Pick<BlogListItem, "title" | "description" | "keywords">): string {
  const haystack = `${item.title} ${item.description} ${item.keywords ?? ""}`.toLowerCase();
  if (/form|response|submission|lead/u.test(haystack)) return "Forms";
  if (/publish|hosting|domain|page|website|cloudflare|storage/u.test(haystack)) return "Publishing";
  if (/aeo|seo|markdown|citation|answer engine/u.test(haystack)) return "Discovery";
  return "AI workflows";
}
