import Link from "next/link";
import { getPublishedBlogs } from "@/app/actions/blog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowRight, Calendar, FileText } from "lucide-react";

export const metadata = {
  title: "Blog & Career Advice | Jobing AI",
  description: "Read the latest tips, tricks, and strategies to craft a perfect resume, beat Applicant Tracking Systems, and land your dream job faster.",
  keywords: ["resume tips", "ATS optimization", "career advice", "job search tech", "interview tips"],
};

export const revalidate = 3600;

export default async function BlogListingPage() {
  const blogs = await getPublishedBlogs();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6 px-4 py-8 lg:p-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
            Blog & Career Advice
          </h1>
          <p className="text-[#6b7280] font-medium">
            Read the latest strategies to craft a perfect resume and beat automated systems.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="pt-4">
          {blogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#e5e5e5]">
              <div className="w-16 h-16 bg-[#f5f5f4] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-[#9ca3af]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No articles yet</h3>
              <p className="text-[#6b7280]">Check back soon for our latest career advice and ATS optimization strategies.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {blogs.map((blog) => (
                <Link 
                  key={blog.id} 
                  href={`/blog/${blog.permalink}`}
                  className="group flex flex-col bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden hover:border-[#8bb800]/50 hover:shadow-xl hover:shadow-[#C1FF00]/5 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div className="w-full aspect-[16/10] bg-slate-100 relative overflow-hidden border-b border-[#f0f0f0]">
                    {blog.image_url ? (
                      <img 
                        src={blog.image_url} 
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#f5f5f4] to-[#f0f0f0] flex items-center justify-center">
                        <span className="text-[#1a1a1a] font-bold text-xl opacity-20">Jobing AI</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Container */}
                  <div className="flex flex-col flex-1 p-6 md:p-8">
                    <div className="flex items-center gap-2 text-[#9ca3af] text-xs font-bold uppercase tracking-widest mb-4">
                      <Calendar size={14} />
                      <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </time>
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#1a1a1a] leading-tight mb-3 group-hover:text-[#8bb800] transition-colors">
                      {blog.title}
                    </h2>
                    
                    <p className="text-[#6b7280] text-sm leading-relaxed mb-6 line-clamp-3">
                      {blog.description}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-2 text-[13px] font-bold text-[#1a1a1a] group-hover:text-[#8bb800] transition-colors">
                      Read Article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
