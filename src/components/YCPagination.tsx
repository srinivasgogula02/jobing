// Server component — windowed pagination. Mirrors the /blog pagination styling.
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/lib/yc";

interface YCPaginationProps {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
  label?: string;
}

export default function YCPagination({
  currentPage,
  totalPages,
  makeHref,
  label = "Pagination",
}: YCPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-center gap-1.5 py-8 px-5 flex-wrap"
    >
      {currentPage > 1 ? (
        <Link
          href={makeHref(currentPage - 1)}
          rel="prev"
          className="flex items-center gap-1 px-3 h-10 rounded-lg border border-[#e5e5e5] text-sm font-bold text-[#1a1a1a] hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors"
        >
          <ChevronLeft size={16} /> Prev
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 h-10 rounded-lg border border-[#f0f0f0] text-sm font-bold text-[#d4d4d4] cursor-not-allowed">
          <ChevronLeft size={16} /> Prev
        </span>
      )}

      {pageWindow(currentPage, totalPages).map((tok, i) =>
        tok === "…" ? (
          <span
            key={`e${i}`}
            className="w-10 h-10 flex items-center justify-center text-sm text-[#9ca3af]"
          >
            …
          </span>
        ) : tok === currentPage ? (
          <span
            key={tok}
            aria-current="page"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-white text-sm font-bold"
          >
            {tok}
          </span>
        ) : (
          <Link
            key={tok}
            href={makeHref(tok)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-sm font-bold text-[#1a1a1a] hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors"
          >
            {tok}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={makeHref(currentPage + 1)}
          rel="next"
          className="flex items-center gap-1 px-3 h-10 rounded-lg border border-[#e5e5e5] text-sm font-bold text-[#1a1a1a] hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors"
        >
          Next <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 h-10 rounded-lg border border-[#f0f0f0] text-sm font-bold text-[#d4d4d4] cursor-not-allowed">
          Next <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
