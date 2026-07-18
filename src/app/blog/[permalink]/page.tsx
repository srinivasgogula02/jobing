import type { Metadata } from "next";
import { cache, isValidElement, type ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { getBlogByPermalink } from "@/app/actions/blog";
import { BlogFooter } from "@/components/BlogFooter";
import BlogShareButtons from "@/components/BlogShareButtons";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { blogCategory, blogReadingMinutes } from "@/lib/blog-config";
import styles from "../blog.module.css";

export const revalidate = 300;

type BlogPostPageProps = {
  params: Promise<{ permalink: string }>;
};

const getBlog = cache((permalink: string) => getBlogByPermalink(permalink));

function headingText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(headingText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) return headingText(value.props.children);
  return "";
}

function headingId(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/gu, "-");
}

function articleHeadings(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.match(/^##\s+(.+?)\s*$/u)?.[1] ?? null)
    .filter((heading): heading is string => Boolean(heading))
    .map((heading) => {
      const label = heading.replace(/[*_`\[\]]/gu, "").trim();
      return { id: headingId(label), label };
    })
    .filter((heading) => heading.id);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { permalink } = await params;
  const blog = await getBlog(permalink);

  if (!blog) return { title: "Guide not found | Jobing AI", robots: { index: false } };

  const canonical = `https://jobing.site/blog/${blog.permalink}`;
  const images = blog.image_url ? [{ url: blog.image_url, alt: blog.title }] : [];

  return {
    title: `${blog.title} | Jobing Guides`,
    description: blog.description,
    keywords: blog.keywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean) ?? [],
    authors: [{ name: "Srinivas Gogula", url: "https://x.com/srinimyr" }],
    alternates: { canonical },
    openGraph: {
      title: blog.title,
      description: blog.description,
      url: canonical,
      siteName: "Jobing AI",
      type: "article",
      publishedTime: blog.created_at,
      authors: ["Srinivas Gogula"],
      images,
    },
    twitter: {
      card: blog.image_url ? "summary_large_image" : "summary",
      title: blog.title,
      description: blog.description,
      creator: "@srinimyr",
      images,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { permalink } = await params;
  const blog = await getBlog(permalink);
  if (!blog) notFound();

  const readingMinutes = blogReadingMinutes(blog.content);
  const category = blogCategory(blog);
  const headings = articleHeadings(blog.content);
  const canonical = `https://jobing.site/blog/${blog.permalink}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description,
    image: blog.image_url ? [blog.image_url] : undefined,
    datePublished: blog.created_at,
    wordCount: blog.content.trim().split(/\s+/u).filter(Boolean).length,
    timeRequired: `PT${readingMinutes}M`,
    mainEntityOfPage: canonical,
    author: { "@type": "Person", name: "Srinivas Gogula", url: "https://x.com/srinimyr" },
    publisher: {
      "@type": "Organization",
      name: "Jobing AI",
      url: "https://jobing.site",
      logo: { "@type": "ImageObject", url: "https://jobing.site/logo.png" },
    },
  };

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#151914]">
      <PublicSiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <header className="border-b border-[#dfe3da]">
          <div className="mx-auto max-w-5xl px-4 pb-10 pt-9 sm:px-6 sm:pb-14 sm:pt-12">
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5f675d] hover:text-[#151914]">
              <ArrowLeft size={15} /> All guides
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#737b70]">
              <span className="text-[#5f8700]">{category}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /><time dateTime={blog.created_at}>{formatDate(blog.created_at)}</time></span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{readingMinutes} min read</span>
            </div>

            <h1 className="mt-5 max-w-4xl font-[family-name:var(--font-home-display)] text-4xl font-semibold leading-[1.01] tracking-[-.045em] sm:text-6xl lg:text-7xl">
              {blog.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#687065] sm:text-xl">{blog.description}</p>
            <div className="mt-7"><BlogShareButtons url={canonical} title={blog.title} permalink={blog.permalink} /></div>
          </div>
        </header>

        {blog.image_url ? (
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
            <div className="aspect-[16/8] overflow-hidden border border-[#dfe3da] bg-[#e9ede5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blog.image_url} alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
            </div>
          </div>
        ) : null}

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[220px_minmax(0,720px)] lg:justify-center lg:gap-14">
          <aside className="lg:order-1">
            {headings.length > 1 ? (
              <>
                <nav className="sticky top-24 hidden border-l border-[#cfd5ca] pl-4 lg:block" aria-label="In this guide">
                  <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#719500]">In this guide</p>
                  <ol className="mt-4 space-y-3">
                    {headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} className="text-xs leading-5 text-[#6e756b] hover:text-[#151914]">{heading.label}</a></li>)}
                  </ol>
                </nav>
                <details className="border border-[#dfe3da] bg-white p-4 lg:hidden">
                  <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#5f8700]">In this guide</summary>
                  <ol className="mt-4 space-y-3 border-t border-[#e5e8e1] pt-4">
                    {headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} className="text-sm leading-5 text-[#5e665b]">{heading.label}</a></li>)}
                  </ol>
                </details>
              </>
            ) : null}
          </aside>

          <article className="min-w-0 border border-[#dfe3da] bg-white px-5 py-7 sm:px-10 sm:py-11 lg:order-2 lg:px-12">
            <div className={styles.article}>
              <ReactMarkdown
                components={{
                  h1: () => null,
                  h2: ({ node, children, ...props }) => {
                    void node;
                    return <h2 id={headingId(headingText(children))} {...props}>{children}</h2>;
                  },
                  h3: ({ node, children, ...props }) => {
                    void node;
                    return <h3 id={headingId(headingText(children))} {...props}>{children}</h3>;
                  },
                  a: ({ node, href = "", ...props }) => {
                    void node;
                    const external = /^https?:\/\//u.test(href) && !href.startsWith("https://jobing.site");
                    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} {...props} />;
                  },
                  img: ({ node, src, alt }) => {
                    void node;
                    return typeof src === "string" ? (
                      <figure className="my-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={alt ?? ""} className="h-auto w-full border border-[#dfe3da]" loading="lazy" decoding="async" />
                        {alt ? <figcaption className="mt-2 text-center font-mono text-[10px] text-[#858c82]">{alt}</figcaption> : null}
                      </figure>
                    ) : null;
                  },
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </div>

            {blog.keywords ? (
              <div className="mt-12 flex flex-wrap gap-2 border-t border-[#dfe3da] pt-6" aria-label="Article topics">
                {blog.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean).slice(0, 8).map((keyword) => (
                  <span key={keyword} className="border border-[#d9ded5] bg-[#f3f5f0] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.08em] text-[#697166]">{keyword}</span>
                ))}
              </div>
            ) : null}

            <section className="mt-10 border-t border-[#dfe3da] pt-8" aria-labelledby="article-next-step">
              <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#719500]">Try it instead of only reading about it</p>
              <h2 id="article-next-step" className="mt-3 text-2xl font-bold tracking-[-.03em] text-[#151914]">Ask your AI to finish the next step.</h2>
              <p className="mt-3 text-sm leading-6 text-[#6e756b]">Connect Jobing to publish a page, create a custom form, and keep the result manageable from one dashboard.</p>
              <Link href="/connector" className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#151914] px-4 text-sm font-semibold text-white">See how to connect <ArrowRight size={15} /></Link>
            </section>
          </article>
        </div>
      </main>
      <BlogFooter />
    </div>
  );
}
