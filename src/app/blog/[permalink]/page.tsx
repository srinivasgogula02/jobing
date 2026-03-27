import { notFound } from "next/navigation";
import { getBlogByPermalink } from "@/app/actions/blog";
import ReactMarkdown from "react-markdown";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    openGraph: {
      title: blog.title,
      description: blog.description,
      type: "article",
      publishedTime: blog.created_at,
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

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Article Header (Hero) */}
        <div className="bg-[#fafafa] border-b border-[#f0f0f0] pt-12 pb-12 px-5 md:pt-16 md:px-10 lg:pt-20 lg:px-16">
          <div className="max-w-3xl mx-auto">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-[13px] font-bold text-[#9ca3af] hover:text-[#1a1a1a] transition-colors mb-8 group uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>

            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] tracking-tight leading-[1.15] mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center gap-4 text-[#6b7280] font-medium text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={blog.created_at}>{formattedDate}</time>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#d1d5db]"></div>
              <div>Jobing AI Team</div>
            </div>
          </div>
        </div>

        {/* Cover Image (if exists) */}
        {blog.image_url && (
          <div className="max-w-4xl mx-auto px-5 -mt-6 relative z-10 mb-12">
            <div className="w-full aspect-[21/9] bg-slate-100 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-[#e5e5e5]">
              <img 
                src={blog.image_url} 
                alt={blog.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="max-w-2xl mx-auto px-5 mt-12 md:mt-16 text-[#374151]">
          {/* Custom styled ReactMarkdown without needing typography plugin */}
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mt-12 mb-6 tracking-tight line-clamp-1 opacity-0 h-0" {...props} />, // Hide h1 if they put it in body, as header already has it. Alternatively, let it render normally:
              h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mt-12 mb-5 tracking-tight" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl md:text-2xl font-bold text-[#1a1a1a] mt-10 mb-4" {...props} />,
              p: ({node, ...props}) => <p className="text-base md:text-[17px] leading-relaxed mb-6 font-medium text-[#4b5563]" {...props} />,
              a: ({node, ...props}) => <a className="text-[#8bb800] font-semibold hover:underline decoration-2 underline-offset-4 transition-all" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-6 space-y-2 text-base md:text-[17px] font-medium text-[#4b5563] marker:text-[#8bb800]" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-6 space-y-2 text-base md:text-[17px] font-medium text-[#4b5563]" {...props} />,
              li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-[#1a1a1a]" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#C1FF00] pl-5 py-1 my-8 text-lg md:text-xl font-medium italic text-[#1a1a1a] bg-[#fafafa] rounded-r-lg" {...props} />,
              code: ({node, ...props}) => <code className="bg-[#f5f5f4] text-[#ef4444] px-1.5 py-0.5 rounded text-sm font-mono border border-[#e5e5e5]" {...props} />,
              pre: ({node, ...props}) => <pre className="bg-[#1a1a1a] text-[#f5f5f4] p-5 rounded-xl my-8 overflow-x-auto text-sm font-mono shadow-lg shadow-black/10" {...props} />,
            }}
          >
            {blog.content}
          </ReactMarkdown>

          {/* Tags */}
          {blog.keywords && (
            <div className="mt-16 pt-8 border-t border-[#f0f0f0] flex flex-wrap gap-2">
              {blog.keywords.split(',').map((keyword, idx) => (
                <span key={idx} className="bg-[#f5f5f4] text-[#6b7280] px-3 py-1.5 rounded-full text-[13px] font-bold tracking-wide uppercase border border-[#e5e5e5]">
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </DashboardLayout>
  );
}
