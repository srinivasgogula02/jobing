import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { getPublishedBlogsPage } from "@/app/actions/blog";
import { BlogFooter } from "@/components/BlogFooter";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { BLOG_PAGE_SIZE, blogCategory, type BlogListItem } from "@/lib/blog-config";

export const revalidate = 300;

type BlogListingPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: BlogListingPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Math.floor(Number(page) || 1));
  const suffix = pageNumber > 1 ? ` · Page ${pageNumber}` : "";
  const canonical = pageNumber > 1 ? `/blog?page=${pageNumber}` : "/blog";

  return {
    title: `Jobing Guides${suffix}`,
    description: "Practical guides for publishing web pages, creating custom forms, collecting responses, and finishing real work through your AI app.",
    alternates: { canonical },
    openGraph: {
      title: `Jobing Guides${suffix}`,
      description: "Practical notes from building pages, forms, and useful AI workflows.",
      url: `https://jobing.site${canonical}`,
      type: "website",
    },
  };
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const tokens: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) tokens.push("…");
  for (let page = start; page <= end; page += 1) tokens.push(page);
  if (end < total - 1) tokens.push("…");
  tokens.push(total);
  return tokens;
}

function hrefFor(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function BlogImage({ post, eager = false }: { post: BlogListItem; eager?: boolean }) {
  if (!post.image_url) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#e9ede5] text-[#65705f]" aria-hidden="true">
        <div className="text-center">
          <FileText className="mx-auto" size={25} />
          <span className="mt-3 block font-mono text-[9px] uppercase tracking-[.18em]">Jobing field note</span>
        </div>
      </div>
    );
  }

  return (
    // Article images may be stored on user-configured origins, so the native
    // element avoids proxying them through the Next image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.image_url}
      alt=""
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
    />
  );
}

export default async function BlogListingPage({ searchParams }: BlogListingPageProps) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Math.floor(Number(pageParam) || 1));
  const { blogs, total } = await getPublishedBlogsPage(requestedPage);
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));

  if (total > 0 && requestedPage > totalPages) {
    redirect(hrefFor(totalPages));
  }

  const currentPage = Math.min(requestedPage, totalPages);
  const featured = currentPage === 1 ? blogs[0] : null;
  const remaining = featured ? blogs.slice(1) : blogs;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Jobing Guides",
    description: "Practical notes on AI workflows, web publishing, custom forms, and building Jobing.",
    url: "https://jobing.site/blog",
    publisher: { "@type": "Organization", name: "Jobing AI", url: "https://jobing.site" },
    blogPost: blogs.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.created_at,
      url: `https://jobing.site/blog/${post.permalink}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#151914]">
      <PublicSiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <header className="border-b border-[#dfe3da]">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:pt-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#719500]">Jobing guides</p>
                <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-home-display)] text-4xl font-semibold leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-7xl">
                  Notes from turning AI answers into finished work.
                </h1>
              </div>
              <p className="border-l-2 border-[#baff29] pl-4 text-sm leading-6 text-[#697166] sm:text-base">
                Practical lessons about publishing web pages, building forms people will complete, collecting responses, and connecting AI to real tools.
              </p>
            </div>

            <ol className="mt-10 grid border border-[#dfe3da] bg-white sm:grid-cols-4" aria-label="The Jobing workflow">
              {["Prompt", "Publish", "Collect", "Understand"].map((step, index) => (
                <li key={step} className="flex min-h-14 items-center gap-3 border-b border-[#e6e9e3] px-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <span className="font-mono text-[10px] text-[#719500]">0{index + 1}</span>
                  <span className="text-sm font-semibold">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {blogs.length === 0 ? (
            <section className="border border-[#dfe3da] bg-white px-5 py-16 text-center sm:px-10" aria-labelledby="empty-blog-title">
              <FileText className="mx-auto text-[#719500]" size={28} />
              <h2 id="empty-blog-title" className="mt-5 text-2xl font-bold tracking-[-.03em]">The next guide is being written.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747c71]">Until then, connect Jobing and turn your next AI conversation into a published page or working form.</p>
              <Link href="/connector" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#151914] px-4 text-sm font-semibold text-white">Connect Jobing AI <ArrowRight size={15} /></Link>
            </section>
          ) : (
            <>
              {featured ? (
                <Link href={`/blog/${featured.permalink}`} className="group grid overflow-hidden border border-[#dfe3da] bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#719500] lg:grid-cols-[1.08fr_.92fr]">
                  <div className="aspect-[16/10] overflow-hidden border-b border-[#dfe3da] lg:aspect-auto lg:min-h-[420px] lg:border-b-0 lg:border-r">
                    <BlogImage post={featured} eager />
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-9 lg:p-11">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[.12em] text-[#727a6f]">
                        <span className="text-[#5f8700]">{blogCategory(featured)}</span>
                        <span aria-hidden="true">/</span>
                        <time dateTime={featured.created_at}>{formatDate(featured.created_at)}</time>
                      </div>
                      <h2 className="mt-5 font-[family-name:var(--font-home-display)] text-3xl font-semibold leading-[1.06] tracking-[-.035em] sm:text-4xl">{featured.title}</h2>
                      <p className="mt-5 text-sm leading-7 text-[#697166] sm:text-base">{featured.description}</p>
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Read the guide <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              ) : null}

              {remaining.length > 0 ? (
                <section className={featured ? "mt-12" : ""} aria-labelledby="more-guides-title">
                  <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#dfe3da] pb-4">
                    <h2 id="more-guides-title" className="text-xl font-bold tracking-[-.025em]">{currentPage === 1 ? "More field notes" : `Guides · Page ${currentPage}`}</h2>
                    <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7b8278]">{total} article{total === 1 ? "" : "s"}</span>
                  </div>
                  <div className="grid border-l border-t border-[#dfe3da] md:grid-cols-2 lg:grid-cols-3">
                    {remaining.map((post) => (
                      <Link key={post.id} href={`/blog/${post.permalink}`} className="group flex min-h-[390px] flex-col border-b border-r border-[#dfe3da] bg-white focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#719500]">
                        <div className="aspect-[16/9] overflow-hidden border-b border-[#dfe3da]"><BlogImage post={post} /></div>
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#747c71]">
                            <span className="text-[#5f8700]">{blogCategory(post)}</span>
                            <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                          </div>
                          <h3 className="mt-4 text-xl font-bold leading-[1.18] tracking-[-.025em] group-hover:text-[#527800]">{post.title}</h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#747c71]">{post.description}</p>
                          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-bold">Read <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {totalPages > 1 ? (
                <nav aria-label="Guide pagination" className="mt-10 flex items-center justify-between border-t border-[#dfe3da] pt-6 sm:justify-center sm:gap-2">
                  {currentPage > 1 ? <Link href={hrefFor(currentPage - 1)} rel="prev" className="inline-flex min-h-11 items-center gap-1 border border-[#d5dad1] bg-white px-3 text-sm font-semibold"><ChevronLeft size={16} /> Previous</Link> : <span />}
                  <span className="font-mono text-[11px] text-[#747c71] sm:hidden">{currentPage} / {totalPages}</span>
                  <div className="hidden items-center gap-1 sm:flex">
                    {pageWindow(currentPage, totalPages).map((token, index) => token === "…" ? <span key={`ellipsis-${index}`} className="grid h-11 w-9 place-items-center text-[#92988f]">…</span> : token === currentPage ? <span key={token} aria-current="page" className="grid h-11 min-w-11 place-items-center bg-[#151914] px-2 text-sm font-bold text-white">{token}</span> : <Link key={token} href={hrefFor(token)} className="grid h-11 min-w-11 place-items-center border border-[#d5dad1] bg-white px-2 text-sm font-semibold">{token}</Link>)}
                  </div>
                  {currentPage < totalPages ? <Link href={hrefFor(currentPage + 1)} rel="next" className="inline-flex min-h-11 items-center gap-1 border border-[#d5dad1] bg-white px-3 text-sm font-semibold">Next <ChevronRight size={16} /></Link> : <span />}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </main>
      <BlogFooter />
    </div>
  );
}
