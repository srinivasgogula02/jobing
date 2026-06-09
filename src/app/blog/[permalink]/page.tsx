import { notFound } from "next/navigation";
import { getBlogByPermalink } from "@/app/actions/blog";
import ReactMarkdown from "react-markdown";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BlogShareButtons from "@/components/BlogShareButtons";

interface BlogPostPageProps {
  params: Promise<{
    permalink: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const blog = await getBlogByPermalink(resolvedParams.permalink);
  
  if (!blog) {
    return { title: "Blog Not Found | Jobing AI" };
  }

  return {
    title: `${blog.title} | Jobing AI Blog`,
    description: blog.description,
    keywords: blog.keywords?.split(",").map(k => k.trim()) || [],
    authors: [{ name: "Srinivas Gogula", url: "https://x.com/srinimyr" }],
    alternates: {
      canonical: `https://jobing.site/blog/${blog.permalink}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.description,
      url: `https://jobing.site/blog/${blog.permalink}`,
      type: "article",
      publishedTime: blog.created_at,
      authors: ["Srinivas Gogula"],
      images: blog.image_url ? [blog.image_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.description,
      creator: "@srinimyr",
      images: blog.image_url ? [blog.image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const blog = await getBlogByPermalink(resolvedParams.permalink);

  if (!blog) {
    notFound();
  }

  // Format date
  const formattedDate = new Date(blog.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.description,
    "image": blog.image_url ? [blog.image_url] : [],
    "datePublished": blog.created_at,
    "author": [{
        "@type": "Person",
        "name": "Srinivas Gogula",
        "url": "https://x.com/srinimyr"
      }]
  };

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: "Blog", href: "/blog" },
        { label: blog.title }
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* We use px-0 on mobile so we can have full-width components if we want, but pad the inner content */}
      <div className="flex flex-col h-full overflow-y-auto px-0 sm:px-4 py-0 sm:py-6 md:p-8 lg:p-10 w-full max-w-5xl mx-auto">
        
        {/* Top Header Section */}
        <div className="px-5 sm:px-0 pt-6 sm:pt-0">
          {/* Back Button & Details */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[13px] font-bold text-[#6b7280] hover:text-[#1a1a1a] hover:bg-slate-50 transition-all w-fit group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Articles
            </Link>

            <div className="flex items-center gap-2 text-[#9ca3af] font-medium text-[13px]">
              <Calendar size={14} />
              <time dateTime={blog.created_at}>{formattedDate}</time>
              <span className="mx-1">•</span>
              <span>Srinivas Gogula</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1a1a1a] tracking-tight leading-[1.15] mb-6">
            {blog.title}
          </h1>

          {/* Share */}
          <div className="mb-8 pb-6 border-b border-[#f0f0f0]">
            <BlogShareButtons
              url={`https://jobing.site/blog/${blog.permalink}`}
              title={blog.title}
              permalink={blog.permalink}
            />
          </div>
        </div>


        {/* Article Content - Reduced padding on mobile */}
        <div className="bg-white sm:rounded-2xl sm:border border-[#e5e5e5] p-5 sm:p-8 md:p-10 lg:p-12 shadow-none sm:shadow-sm flex-1">
          <article className="max-w-3xl mx-auto text-[#374151]">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mt-10 sm:mt-12 mb-5 sm:mb-6 tracking-tight hidden" {...props} />, // usually we hide body h1s
                h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mt-10 sm:mt-12 mb-4 sm:mb-5 tracking-tight border-b border-[#f0f0f0] pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl md:text-2xl font-bold text-[#1a1a1a] mt-8 sm:mt-10 mb-3 sm:mb-4" {...props} />,
                p: ({node, ...props}) => <p className="text-[16px] xl:text-[17px] leading-relaxed mb-5 sm:mb-6 font-medium text-[#4b5563]" {...props} />,
                a: ({node, ...props}) => <a className="text-[#8bb800] font-semibold hover:underline decoration-2 underline-offset-4 transition-all break-words" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 sm:ml-6 mb-5 sm:mb-6 space-y-2 text-[16px] xl:text-[17px] font-medium text-[#4b5563] marker:text-[#8bb800]" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 sm:ml-6 mb-5 sm:mb-6 space-y-2 text-[16px] xl:text-[17px] font-medium text-[#4b5563]" {...props} />,
                li: ({node, ...props}) => <li className="pl-1 sm:pl-2 leading-relaxed" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-[#1a1a1a] bg-[#C1FF00]/10 px-1 rounded-sm" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#8bb800] pl-4 sm:pl-5 py-2 my-6 sm:my-8 text-[17px] md:text-lg font-medium italic text-[#1a1a1a] bg-[#fafafa] rounded-r-lg" {...props} />,
                code: ({node, ...props}) => <code className="bg-[#f5f5f4] text-[#ef4444] px-1.5 py-0.5 rounded text-[13px] sm:text-sm font-mono border border-[#e5e5e5] break-words" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-[#1a1a1a] text-[#f5f5f4] p-4 sm:p-5 rounded-xl my-6 sm:my-8 overflow-x-auto text-[13px] md:text-sm font-mono shadow-lg shadow-black/10" {...props} />,
                img: ({node, alt, ...props}) => (
                  <figure className="my-8 sm:my-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={alt || ""} className="w-full h-auto rounded-xl border border-[#e5e5e5] bg-[#fafafa]" {...props} />
                    {alt && (
                      <figcaption className="mt-3 text-center text-[13px] font-medium text-[#9ca3af]">{alt}</figcaption>
                    )}
                  </figure>
                ),
              }}
            >
              {blog.content}
            </ReactMarkdown>

            {/* Keyword Tags */}
            {blog.keywords && (
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[#f0f0f0] flex flex-wrap gap-2">
                {blog.keywords.split(',').map((keyword, idx) => (
                  <span key={idx} className="bg-[#f5f5f4] text-[#6b7280] px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold tracking-wide uppercase border border-[#e5e5e5] hover:bg-[#e5e5e5] transition-colors cursor-default">
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
        
        {/* Bottom spacer for scrollability */}
        <div className="h-12 sm:h-20 shrink-0"></div>
      </div>
    </DashboardLayout>
  );
}
