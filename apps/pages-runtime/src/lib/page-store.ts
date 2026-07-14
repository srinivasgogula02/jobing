import "server-only";

import { z } from "zod";

const pageSchema = z.object({
  html_content: z.string().min(1).max(500_000),
  updated_at: z.string().nullable().optional(),
});

export type PublicPage = z.infer<typeof pageSchema>;

export async function getPublicPage(id: string): Promise<PublicPage | null> {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) throw new Error("Pages Runtime database is not configured.");

  const url = new URL("/rest/v1/pages", baseUrl);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("select", "html_content,updated_at");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`Pages Runtime database returned ${response.status}.`);

  const pages = z.array(pageSchema).max(1).parse(await response.json());
  return pages[0] ?? null;
}

