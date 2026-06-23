// Server component — renders a table of YC companies, each row showing what the
// company does (description) inline. Shared by /yc (directory) and /yc/hiring.
import { ExternalLink, Users } from "lucide-react";
import type { YCCompany } from "@/lib/yc";

function statusClass(status: string): string {
  switch (status) {
    case "Public":
      return "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]";
    case "Acquired":
      return "bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]";
    case "Active":
      return "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]";
  }
}

function Logo({ company }: { company: YCCompany }) {
  const src = company.small_logo_thumb_url;
  const valid = src && src.startsWith("http");
  if (!valid) {
    return (
      <div className="w-10 h-10 shrink-0 rounded-md bg-[#f3f4f6] border border-[#e5e5e5] flex items-center justify-center text-sm font-bold text-[#9ca3af]">
        {company.name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="w-10 h-10 shrink-0 rounded-md object-contain bg-white border border-[#e5e5e5]"
    />
  );
}

export default function YCCompanyTable({ companies }: { companies: YCCompany[] }) {
  return (
    <div className="w-full">
      {/* Header row — desktop only */}
      <div className="hidden lg:grid grid-cols-[minmax(0,3fr)_96px_minmax(0,1fr)_72px_104px] gap-4 px-5 py-3 bg-[#fafafa] border-b border-[#e5e5e5] text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
        <span>Company &amp; what they do</span>
        <span>Batch</span>
        <span>Industry</span>
        <span className="text-right">Team</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-[#e5e5e5] border-b border-[#e5e5e5]">
        {companies.map((c) => {
          const description = c.long_description || c.one_liner;
          const linkTarget = c.website || c.url;
          return (
            <div
              key={c.id}
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_96px_minmax(0,1fr)_72px_104px] gap-2 lg:gap-4 px-5 py-4 bg-white hover:bg-[#fafafa] transition-colors lg:items-start"
            >
              {/* Company + description */}
              <div className="flex items-start gap-3 min-w-0">
                <Logo company={c} />
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                    {linkTarget ? (
                      <a
                        href={linkTarget}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-extrabold text-[15px] text-[#1a1a1a] hover:text-[#8bb800] transition-colors inline-flex items-center gap-1"
                      >
                        {c.name}
                        <ExternalLink size={12} className="text-[#9ca3af]" />
                      </a>
                    ) : (
                      <span className="font-extrabold text-[15px] text-[#1a1a1a]">{c.name}</span>
                    )}
                    {c.isHiring && (
                      <span className="inline-flex items-center h-4 px-1.5 bg-[#C1FF00] text-[#1a1a1a] rounded-full text-[9px] font-bold uppercase tracking-wide">
                        Hiring
                      </span>
                    )}
                    {c.top_company && (
                      <span className="inline-flex items-center h-4 px-1.5 bg-[#1a1a1a] text-white rounded-full text-[9px] font-bold uppercase tracking-wide">
                        Top
                      </span>
                    )}
                  </div>

                  {/* One-liner = the crisp "what they do" */}
                  {c.one_liner && (
                    <p className="text-[13px] font-semibold text-[#374151] leading-snug mt-1">
                      {c.one_liner}
                    </p>
                  )}
                  {/* Fuller description */}
                  {description && description !== c.one_liner && (
                    <p className="text-[13px] text-[#6b7280] leading-relaxed mt-1 line-clamp-3">
                      {description}
                    </p>
                  )}

                  {/* Mobile / tablet meta line (the columns are hidden < lg) */}
                  <div className="flex lg:hidden flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] text-[#9ca3af] font-semibold">
                    <span className="font-mono">{c.batch}</span>
                    {c.industry && <span>{c.industry}</span>}
                    {!!c.team_size && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {c.team_size.toLocaleString()}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-bold ${statusClass(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch */}
              <div className="hidden lg:block text-[12px] font-mono text-[#6b7280] tabular-nums pt-0.5">
                {c.batch}
              </div>

              {/* Industry */}
              <div className="hidden lg:block text-[12px] text-[#6b7280] truncate pt-0.5" title={c.industry}>
                {c.industry || "—"}
              </div>

              {/* Team */}
              <div className="hidden lg:block text-[12px] font-mono text-[#6b7280] text-right tabular-nums pt-0.5">
                {c.team_size ? c.team_size.toLocaleString() : "—"}
              </div>

              {/* Status */}
              <div className="hidden lg:block pt-0.5">
                <span
                  className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-bold ${statusClass(
                    c.status
                  )}`}
                >
                  {c.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
