import Link from "next/link";
import { getPublishedBlogs } from "@/app/actions/blog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, FileText } from "lucide-react";

export const metadata = {
  title: "Blog & Career Advice | Jobing AI",
  description: "Read the latest tips, tricks, and strategies to craft a perfect resume, beat Applicant Tracking Systems, and land your dream job faster.",
  keywords: ["resume tips", "ATS optimization", "career advice", "job search tech", "interview tips"],
};

export const revalidate = 3600;

export default async function BlogListingPage() {
  const blogs = await getPublishedBlogs();

  return (
    <DashboardLayout breadcrumbs={[{ label: "Blog" }]}>
      <div className="flex flex-col h-full space-y-8 px-2 py-4 lg:p-0">
        
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm mx-2 lg:mx-0">
            <div className="w-20 h-20 rounded-3xl bg-[#C1FF00]/10 flex items-center justify-center mb-6 shadow-sm border border-[#C1FF00]/20">
               <FileText size={32} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No articles yet</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm mb-8 leading-relaxed">
              We are brewing up some fresh career advice. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2 lg:px-0 pb-10">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/blog/${blog.permalink}`}
                className="card group relative flex flex-col p-5 md:p-6 overflow-hidden hover:border-[#C1FF00] transition-colors"
              >
                 {/* Card Header (Image or Icon) */}
                 <div className="w-full aspect-[16/9] bg-[var(--bg-subtle)] rounded-xl overflow-hidden mb-5 border border-[var(--border)] group-hover:border-[#C1FF00]/30 shadow-sm relative">
                   {blog.image_url ? (
                     <img 
                       src={blog.image_url} 
                       alt={blog.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                       loading="lazy"
                     />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
                       <FileText size={24} className="mb-2 opacity-50" />
                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Article</span>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col flex-1">
                   <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-3">
                     <Calendar size={10} strokeWidth={2.5} />
                     <time dateTime={blog.created_at}>
                        {new Date(blog.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </time>
                   </div>
                   
                   <h3 className="text-[15px] md:text-[17px] font-bold text-[var(--text)] tracking-tight line-clamp-2 leading-snug mb-2 group-hover:text-[#8bb800] transition-colors">
                     {blog.title}
                   </h3>
                   
                   <p className="text-[var(--text-secondary)] text-[13px] md:text-[13.5px] line-clamp-2 leading-relaxed font-medium mt-auto pt-2 border-t border-[var(--border)]">
                     {blog.description}
                   </p>
                 </div>

                 {/* Decorative background element */}
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#C1FF00]/5 rounded-full blur-2xl group-hover:bg-[#C1FF00]/10 transition-all duration-500 pointer-events-none" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
