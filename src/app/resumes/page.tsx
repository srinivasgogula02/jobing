import { DashboardLayout } from "@/components/DashboardLayout";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { FileText, Calendar, ExternalLink, Download } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const metadata = {
  title: "My Resumes | Jobing AI",
};

export default async function ResumesPage() {
  const user = await currentUser();

  let resumes: any[] = [];
  
  if (user) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: records, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('clerk_user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && records) {
      resumes = records;
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-8 max-w-6xl mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">
            My Resumes
          </h1>
          <p className="text-sm text-[#6b7280]">View and download your previously generated, tailored resumes.</p>
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f4] flex items-center justify-center mb-6">
               <FileText size={28} className="text-[#9ca3af]" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No resumes yet</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm mb-8">
              You haven't generated any tailored resumes yet. Let's create your first one using the AI Resume Builder!
            </p>
            <Link 
              href="/create" 
              className="btn-primary px-6 py-3 text-sm"
            >
              Create New Resume
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map((resume) => (
              <div 
                key={resume.id} 
                className="group relative flex flex-col bg-white rounded-xl border border-[#e5e5e5] hover:border-[#d4d4d4] hover:shadow-md transition-all p-5 overflow-hidden"
              >
                 <div className="flex items-start justify-between mb-4">
                   <div className="w-10 h-10 bg-[#C1FF00]/20 rounded-lg flex items-center justify-center text-[#1a1a1a]">
                     <FileText size={18} />
                   </div>
                   <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] font-medium bg-[#f5f5f4] px-2.5 py-1 rounded-md border border-[#e5e5e5]">
                     <Calendar size={10} />
                     {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
                   </div>
                 </div>

                 <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-1.5 line-clamp-1">
                   {resume.job_title || "Tailored Resume"}
                 </h3>
                 
                 <p className="text-[#6b7280] text-[13px] line-clamp-2 mb-6 flex-1">
                    {resume.job_description.slice(0, 100)}...
                 </p>

                 <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[#f0f0f0]">
                    {resume.pdf_url && (
                        <>
                           <a 
                             href={resume.pdf_url} 
                             target="_blank" 
                             rel="noreferrer"
                             className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-[#fafafa] hover:bg-[#f5f5f4] text-[#1a1a1a] font-semibold transition-colors border border-[#e5e5e5] text-[13px]"
                           >
                             <ExternalLink size={14} /> View
                           </a>
                           <a 
                             href={resume.pdf_url} 
                             download="Resume.pdf"
                             className="p-2 rounded-md bg-[#fafafa] hover:bg-[#f5f5f4] text-[#1a1a1a] transition-colors border border-[#e5e5e5]"
                           >
                             <Download size={16} />
                           </a>
                        </>
                    )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
