"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import type { Facets } from "@/lib/yc";

interface YCFiltersProps {
  facets: Facets;
  // Whether the batch/industry/status/region/sort controls are shown.
  // The hiring board reuses the same search box but hides batch (less relevant there).
  showStatus?: boolean;
}

const SELECT_CLASS =
  "h-10 px-3 pr-8 bg-white border border-[#e5e5e5] rounded-lg text-sm font-semibold text-[#1a1a1a] hover:border-[#d4d4d4] focus:outline-none focus:border-[#8bb800] focus:ring-2 focus:ring-[#C1FF00]/40 transition-colors appearance-none cursor-pointer";

export default function YCFilters({ facets, showStatus = true }: YCFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushWith(mutate: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    sp.delete("page"); // any filter change resets to page 1
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function onSelect(key: string, value: string) {
    pushWith((sp) => (value ? sp.set(key, value) : sp.delete(key)));
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushWith((sp) => (value.trim() ? sp.set("q", value.trim()) : sp.delete("q")));
    }, 350);
  }

  const activeTag = params.get("tag");
  const hasAny =
    !!params.get("q") ||
    !!params.get("batch") ||
    !!params.get("industry") ||
    !!params.get("region") ||
    !!params.get("status") ||
    !!activeTag;

  return (
    <div className="w-full bg-[#fafafa] border-b border-[#e5e5e5] px-5 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            type="search"
            inputMode="search"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search companies, ideas, keywords…"
            aria-label="Search YC companies"
            className="w-full h-10 pl-9 pr-3 bg-white border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#8bb800] focus:ring-2 focus:ring-[#C1FF00]/40 transition-colors"
          />
        </div>

        {/* Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by batch"
            value={params.get("batch") ?? ""}
            onChange={(e) => onSelect("batch", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All batches</option>
            {facets.batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by industry"
            value={params.get("industry") ?? ""}
            onChange={(e) => onSelect("industry", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All industries</option>
            {facets.industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by region"
            value={params.get("region") ?? ""}
            onChange={(e) => onSelect("region", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All regions</option>
            {facets.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {showStatus && (
            <select
              aria-label="Filter by status"
              value={params.get("status") ?? ""}
              onChange={(e) => onSelect("status", e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Any status</option>
              {facets.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Sort companies"
            value={params.get("sort") ?? "recent"}
            onChange={(e) => onSelect("sort", e.target.value === "recent" ? "" : e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="recent">Newest batch</option>
            <option value="team">Largest team</option>
            <option value="name">A–Z</option>
          </select>
        </div>
      </div>

      {/* Active-filter chips */}
      {(activeTag || hasAny) && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {activeTag && (
            <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 bg-[#C1FF00]/15 border border-[#C1FF00]/40 rounded-full text-xs font-bold text-[#5c7700]">
              {activeTag}
              <button
                onClick={() => onSelect("tag", "")}
                aria-label={`Remove ${activeTag} filter`}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#C1FF00]/30"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {hasAny && (
            <button
              onClick={() => {
                setQ("");
                startTransition(() => router.push(pathname, { scroll: false }));
              }}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-bold text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
            >
              <X size={12} /> Clear all
            </button>
          )}
          {isPending && (
            <span className="text-xs text-[#9ca3af] font-medium">updating…</span>
          )}
        </div>
      )}
    </div>
  );
}
