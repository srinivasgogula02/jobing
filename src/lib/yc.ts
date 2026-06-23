// ─────────────────────────────────────────────────────────────────────────────
// yc.ts · Data layer for the YC Companies Explorer (/yc)
// Source: https://github.com/yc-oss/api (static JSON on GitHub Pages, daily refresh)
// Read-only. No DB, no env vars. Cached via Next's data cache with daily ISR.
// ─────────────────────────────────────────────────────────────────────────────

const YC_BASE = "https://yc-oss.github.io/api";
const DAY = 86_400; // seconds — the upstream API regenerates roughly daily

// Real schema, verified against companies/all.json (only the fields we use).
export interface YCCompany {
  id: number;
  name: string;
  slug: string;
  former_names: string[];
  small_logo_thumb_url: string;
  website: string;
  all_locations: string;
  long_description: string;
  one_liner: string;
  team_size: number | null;
  industry: string;
  subindustry: string;
  launched_at: number;
  tags: string[];
  top_company: boolean;
  isHiring: boolean;
  nonprofit: boolean;
  batch: string;
  status: string; // "Active" | "Acquired" | "Public" | "Inactive" | ...
  industries: string[];
  regions: string[];
  stage: string;
  url: string; // public YC profile page
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${YC_BASE}${path}`, {
    next: { revalidate: DAY },
  });
  if (!res.ok) {
    throw new Error(`YC API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getAllCompanies(): Promise<YCCompany[]> {
  return fetchJson<YCCompany[]>("/companies/all.json");
}

export async function getHiringCompanies(): Promise<YCCompany[]> {
  return fetchJson<YCCompany[]>("/companies/hiring.json");
}

// ── Filtering / sorting ──────────────────────────────────────────────────────

export interface CompanyFilters {
  q?: string;
  batch?: string;
  industry?: string;
  region?: string;
  status?: string;
  tag?: string;
}

export function filterCompanies(
  companies: YCCompany[],
  f: CompanyFilters
): YCCompany[] {
  const q = f.q?.trim().toLowerCase();
  return companies.filter((c) => {
    if (f.batch && c.batch !== f.batch) return false;
    if (f.industry && c.industry !== f.industry) return false;
    if (f.status && c.status !== f.status) return false;
    if (f.region && !c.regions.includes(f.region)) return false;
    if (f.tag && !c.tags.includes(f.tag)) return false;
    if (q) {
      const hay = `${c.name} ${c.one_liner} ${c.long_description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Batches read like "Winter 2012" / "Summer 2026" / "Spring 2024" / "Fall 2024".
// Rank newest-first for both the dropdown and default sort.
const SEASON_ORDER: Record<string, number> = {
  winter: 0,
  spring: 1,
  summer: 2,
  fall: 3,
};

function batchRank(batch: string): number {
  const m = batch.toLowerCase().match(/(winter|spring|summer|fall)\s+(\d{4})/);
  if (!m) return -1;
  const year = parseInt(m[2], 10);
  return year * 10 + (SEASON_ORDER[m[1]] ?? 0);
}

export type SortKey = "recent" | "team" | "name";

export function sortCompanies(companies: YCCompany[], sort: SortKey): YCCompany[] {
  const out = [...companies];
  switch (sort) {
    case "team":
      out.sort((a, b) => (b.team_size ?? 0) - (a.team_size ?? 0));
      break;
    case "name":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "recent":
    default:
      out.sort((a, b) => batchRank(b.batch) - batchRank(a.batch) || a.name.localeCompare(b.name));
      break;
  }
  return out;
}

// ── Facets (dropdown options derived from the dataset) ───────────────────────

export interface Facets {
  batches: string[];
  industries: string[];
  regions: string[];
  statuses: string[];
}

export function buildFacets(companies: YCCompany[]): Facets {
  const batches = new Set<string>();
  const industries = new Set<string>();
  const regions = new Set<string>();
  const statuses = new Set<string>();

  for (const c of companies) {
    if (c.batch) batches.add(c.batch);
    if (c.industry) industries.add(c.industry);
    if (c.status) statuses.add(c.status);
    for (const r of c.regions) regions.add(r);
  }

  return {
    batches: [...batches].sort((a, b) => batchRank(b) - batchRank(a)),
    industries: [...industries].sort(),
    regions: [...regions].sort(),
    statuses: [...statuses].sort(),
  };
}

// ── Pagination ───────────────────────────────────────────────────────────────

export const YC_PAGE_SIZE = 30;

export function paginate<T>(items: T[], page: number, size = YC_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    totalPages,
    currentPage: current,
  };
}

// Windowed page tokens, e.g. [1, 2, 3, "…", 199]. Mirrors the /blog pattern.
export function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const tokens: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) tokens.push("…");
  for (let p = start; p <= end; p++) tokens.push(p);
  if (end < total - 1) tokens.push("…");
  tokens.push(total);
  return tokens;
}
