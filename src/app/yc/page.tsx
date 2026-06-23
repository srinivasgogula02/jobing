import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import YCFilters from "@/components/YCFilters";
import YCCompanyTable from "@/components/YCCompanyTable";
import YCPagination from "@/components/YCPagination";
import { Search, Briefcase } from "lucide-react";
import {
  getAllCompanies,
  filterCompanies,
  sortCompanies,
  buildFacets,
  paginate,
  type SortKey,
} from "@/lib/yc";

export const revalidate = 86400;

export const metadata = {
  title: "Y Combinator Companies Directory — Search 5,900+ YC Startups | Jobing",
  description:
    "Browse and search every Y Combinator company. Filter by batch, industry, region, and status. See what each YC startup does, team size, and who's hiring.",
  keywords: [
    "Y Combinator companies",
    "YC startups list",
    "YC company directory",
    "YC batch companies",
    "startups hiring",
    "YC AI companies",
  ],
  alternates: { canonical: "https://jobing.site/yc" },
  openGraph: {
    title: "Y Combinator Companies Directory | Jobing",
    description:
      "Search every YC company — filter by batch, industry, region, and status.",
    url: "https://jobing.site/yc",
    type: "website",
  },
};

interface SearchParams {
  q?: string;
  batch?: string;
  industry?: string;
  region?: string;
  status?: string;
  tag?: string;
  sort?: string;
  page?: string;
}

export default async function YCDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = await getAllCompanies();
  const facets = buildFacets(all);

  const sort = (sp.sort as SortKey) || "recent";
  const filtered = sortCompanies(
    filterCompanies(all, {
      q: sp.q,
      batch: sp.batch,
      industry: sp.industry,
      region: sp.region,
      status: sp.status,
      tag: sp.tag,
    }),
    sort
  );

  const requestedPage = Math.max(1, Math.floor(Number(sp.page) || 1));
  const { items, total, totalPages, currentPage } = paginate(filtered, requestedPage);

  // Preserve active filters across pagination links.
  const makeHref = (p: number) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k !== "page" && v) usp.set(k, String(v));
    }
    if (p > 1) usp.set("page", String(p));
    const qs = usp.toString();
    return qs ? `/yc?${qs}` : "/yc";
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "YC Companies" }]} fullBleed>
      <div className="flex flex-col h-full w-full">
        {/* Hero */}
        <div className="px-5 py-8 lg:py-10 bg-white border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8bb800] mb-3">
            <span className="w-6 h-px bg-[#C1FF00]" /> Startup Directory
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-[#1a1a1a] tracking-tight max-w-2xl leading-tight">
            Every Y Combinator company, in one searchable place
          </h1>
          <p className="text-[#6b7280] text-sm lg:text-base mt-3 max-w-2xl leading-relaxed">
            {all.length.toLocaleString()} companies across {facets.batches.length} batches.
            Search what they do, filter by industry or region, and spot who&apos;s hiring.{" "}
            <Link href="/yc/hiring" className="text-[#8bb800] font-semibold hover:underline whitespace-nowrap">
              See who&apos;s hiring →
            </Link>
          </p>
        </div>

        <YCFilters facets={facets} />

        {/* Result count + hiring shortcut */}
        <div className="flex items-center justify-between px-5 py-3 text-[12px] text-[#6b7280] font-semibold border-b border-[#e5e5e5] bg-white">
          <span>
            {total.toLocaleString()} {total === 1 ? "company" : "companies"}
          </span>
          <Link
            href="/yc/hiring"
            className="inline-flex items-center gap-1.5 text-[#8bb800] hover:underline"
          >
            <Briefcase size={13} /> Hiring board
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 lg:p-24 bg-white min-h-[40vh]">
            <div className="w-16 h-16 bg-[#C1FF00]/10 flex items-center justify-center mb-5 border border-[#C1FF00]/20 rounded-lg">
              <Search size={28} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No companies match</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm leading-relaxed">
              Try a different search or{" "}
              <Link href="/yc" className="text-[#8bb800] font-semibold hover:underline">
                clear your filters
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <YCCompanyTable companies={items} />
            <YCPagination
              currentPage={currentPage}
              totalPages={totalPages}
              makeHref={makeHref}
              label="YC companies pagination"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
