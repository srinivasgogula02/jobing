import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import YCFilters from "@/components/YCFilters";
import YCCompanyTable from "@/components/YCCompanyTable";
import YCPagination from "@/components/YCPagination";
import { Briefcase, ArrowLeft } from "lucide-react";
import {
  getHiringCompanies,
  filterCompanies,
  sortCompanies,
  buildFacets,
  paginate,
  type SortKey,
} from "@/lib/yc";

export const revalidate = 86400;

export const metadata = {
  title: "Y Combinator Companies Hiring Now — YC Startup Jobs | Jobing",
  description:
    "Live list of Y Combinator companies that are currently hiring. Filter by region (incl. Remote and India), industry, and batch to find YC startups with open roles.",
  keywords: [
    "YC companies hiring",
    "Y Combinator jobs",
    "startup jobs",
    "YC startups hiring remote",
    "YC India jobs",
    "startup careers",
  ],
  alternates: { canonical: "https://jobing.site/yc/hiring" },
  openGraph: {
    title: "Y Combinator Companies Hiring Now | Jobing",
    description:
      "Live list of YC companies currently hiring. Filter by region, industry, and batch.",
    url: "https://jobing.site/yc/hiring",
    type: "website",
  },
};

interface SearchParams {
  q?: string;
  industry?: string;
  region?: string;
  tag?: string;
  sort?: string;
  page?: string;
}

export default async function YCHiringPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hiring = await getHiringCompanies();
  const facets = buildFacets(hiring);

  const sort = (sp.sort as SortKey) || "recent";
  const filtered = sortCompanies(
    filterCompanies(hiring, {
      q: sp.q,
      industry: sp.industry,
      region: sp.region,
      tag: sp.tag,
    }),
    sort
  );

  const requestedPage = Math.max(1, Math.floor(Number(sp.page) || 1));
  const { items, total, totalPages, currentPage } = paginate(filtered, requestedPage);

  const makeHref = (p: number) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k !== "page" && v) usp.set(k, String(v));
    }
    if (p > 1) usp.set("page", String(p));
    const qs = usp.toString();
    return qs ? `/yc/hiring?${qs}` : "/yc/hiring";
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "YC Companies", href: "/yc" }, { label: "Hiring" }]} fullBleed>
      <div className="flex flex-col h-full w-full">
        {/* Hero */}
        <div className="px-5 py-8 lg:py-10 bg-white border-b border-[#e5e5e5]">
          <Link
            href="/yc"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6b7280] hover:text-[#1a1a1a] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> All companies
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8bb800] mb-3">
            <Briefcase size={13} /> Hiring Now
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-[#1a1a1a] tracking-tight max-w-2xl leading-tight">
            {hiring.length.toLocaleString()} YC companies are hiring right now
          </h1>
          <p className="text-[#6b7280] text-sm lg:text-base mt-3 max-w-2xl leading-relaxed">
            Use the <strong className="text-[#1a1a1a] font-semibold">Region</strong> filter to narrow
            to <strong className="text-[#1a1a1a] font-semibold">Remote</strong> or{" "}
            <strong className="text-[#1a1a1a] font-semibold">India</strong> roles, then open a company
            to apply on its site or YC profile.
          </p>
        </div>

        {/* Region filter is the star here — hide status (all are active enough to hire) */}
        <YCFilters facets={facets} showStatus={false} />

        <div className="flex items-center px-5 py-3 text-[12px] text-[#6b7280] font-semibold border-b border-[#e5e5e5] bg-white">
          <span>
            {total.toLocaleString()} hiring {total === 1 ? "company" : "companies"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 lg:p-24 bg-white min-h-[40vh]">
            <div className="w-16 h-16 bg-[#C1FF00]/10 flex items-center justify-center mb-5 border border-[#C1FF00]/20 rounded-lg">
              <Briefcase size={28} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No matches</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm leading-relaxed">
              No hiring companies match those filters.{" "}
              <Link href="/yc/hiring" className="text-[#8bb800] font-semibold hover:underline">
                Reset
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
              label="Hiring companies pagination"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
