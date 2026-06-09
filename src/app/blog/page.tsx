import Link from "next/link";
import { getPublishedBlogsPage } from "@/app/actions/blog";
import { BLOG_PAGE_SIZE } from "@/lib/blog-config";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Blog & Career Advice | Jobing AI",
  description: "Read the latest tips, tricks, and strategies to craft a perfect resume, beat Applicant Tracking Systems, and land your dream job faster.",
  keywords: ["resume tips", "ATS optimization", "career advice", "job search tech", "interview tips"],
};

// Build a compact, windowed list of page tokens: e.g. [1, 2, 3, 4, 5, "…", 12].
function pageWindow(current: number, total: number): (number | "…")[] {
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

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Math.floor(Number(pageParam) || 1));

  const { blogs, total } = await getPublishedBlogsPage(requestedPage);
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const hrefFor = (p: number) => (p <= 1 ? "/blog" : `/blog?page=${p}`);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Blog" }]}>
      <div className="flex flex-col h-full w-full">

        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 lg:p-24 bg-white border-b border-[#e5e5e5] min-h-[50vh]">
            <div className="w-20 h-20 bg-[#C1FF00]/10 flex items-center justify-center mb-6 border border-[#C1FF00]/20 rounded-none">
               <FileText size={32} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">
              {total > 0 ? "Nothing on this page" : "No articles yet"}
            </h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm leading-relaxed">
              {total > 0 ? (
                <>That page is empty. <Link href="/blog" className="text-[#8bb800] font-semibold hover:underline">Back to the first page</Link>.</>
              ) : (
                "We are brewing up some fresh career advice. Check back soon!"
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 border-t border-b border-[#e5e5e5] w-full bg-transparent">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.permalink}`}
                  className="group relative flex flex-col bg-white hover:bg-[#fafafa] transition-colors overflow-hidden min-h-[340px] border-b border-r border-[#e5e5e5]"
                >
                   {/* Card Header (Image or Icon) - Edge to Edge */}
                   <div className="w-full aspect-[16/9] bg-[#f5f5f4] overflow-hidden border-b border-[#e5e5e5] relative shrink-0">
                     {blog.image_url ? (
                       <img
                         src={blog.image_url}
                         alt={blog.title}
                         className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-500 ease-out"
                         loading="lazy"
                       />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-[#9ca3af] group-hover:bg-[#f0f0f0] transition-colors">
                         <FileText size={24} className="mb-2 opacity-50" />
                         <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Article</span>
                       </div>
                     )}
                   </div>

                   {/* Text Content - Padded */}
                   <div className="flex flex-col flex-1 p-6 md:p-8">
                     <div className="flex items-center gap-1.5 text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider mb-4">
                       <Calendar size={12} strokeWidth={2.5} />
                       <time dateTime={blog.created_at}>
                          {new Date(blog.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </time>
                     </div>

                     <h3 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight line-clamp-3 leading-snug mb-3 group-hover:text-[#8bb800] transition-colors">
                       {blog.title}
                     </h3>

                     <p className="text-[#6b7280] text-[13px] line-clamp-3 leading-relaxed font-medium mt-auto pt-4 border-t border-[#f0f0f0]">
                       {blog.description}
                     </p>
                   </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="flex items-center justify-center gap-1.5 py-8 px-5"
              >
                {currentPage > 1 ? (
                  <Link
                    href={hrefFor(currentPage - 1)}
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
                    <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-[#9ca3af]">…</span>
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
                      href={hrefFor(tok)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] text-sm font-bold text-[#1a1a1a] hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors"
                    >
                      {tok}
                    </Link>
                  )
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={hrefFor(currentPage + 1)}
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
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
