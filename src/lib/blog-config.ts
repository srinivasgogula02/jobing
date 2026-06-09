// Plain (non-"use server") module for blog values/types that need to be imported
// by both the server actions and client/server components. A "use server" file may
// only export async functions, so shared constants like the page size live here.

// Default posts per listing page. 12 divides evenly across the 1/2/3/4-column
// responsive grid so pages always end on a clean row.
export const BLOG_PAGE_SIZE = 12;

// Lightweight shape for the blog listing — deliberately excludes the heavy
// `content` column so the index page doesn't pull every post's full markdown.
export interface BlogListItem {
  id: string;
  created_at: string;
  title: string;
  description: string;
  image_url: string | null;
  permalink: string;
}
