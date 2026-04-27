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
      <div className="flex flex-col h-full w-full">
        
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 lg:p-24 bg-white border-b border-[#e5e5e5] min-h-[50vh]">
            <div className="w-20 h-20 bg-[#C1FF00]/10 flex items-center justify-center mb-6 border border-[#C1FF00]/20 rounded-none">
               <FileText size={32} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No articles yet</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm leading-relaxed">
              We are brewing up some fresh career advice. Check back soon!
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
}
