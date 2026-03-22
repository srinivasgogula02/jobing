import { DashboardLayout } from "@/components/DashboardLayout";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ResumeActions } from "@/components/ResumeActions";

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
      <div className="flex flex-col h-full space-y-8 px-2 py-4 lg:p-0">
        <div className="space-y-1 bg-white px-5 py-4 lg:p-6 lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm border-b border-[#f0f0f0] lg:border-none shrink-0">
          <h1 className="text-xl md:text-2xl font-black text-[#1a1a1a] tracking-tight leading-tight">
            My Resumes
          </h1>
          <p className="text-[10px] md:text-sm text-[#6b7280] font-bold uppercase tracking-widest mt-1">Managed Tailored Collections</p>
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm mx-2 lg:mx-0">
            <div className="w-20 h-20 rounded-3xl bg-[#C1FF00]/10 flex items-center justify-center mb-6 shadow-sm border border-[#C1FF00]/20">
               <FileText size={32} className="text-[#1a1a1a]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No resumes yet</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-sm mb-8 leading-relaxed">
              You haven't generated any tailored resumes yet. Let's create your first one using the AI Resume Builder!
            </p>
            <Link 
              href="/create" 
              className="btn-primary px-8 py-3.5 text-sm shadow-lg shadow-[#C1FF00]/20 hover:scale-[1.02] transition-transform"
            >
              Create New Resume
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2 lg:px-0 pb-10">
            {resumes.map((resume) => (
              <div 
                key={resume.id} 
                className="card group relative flex flex-col p-5 md:p-6 overflow-hidden hover:border-[#C1FF00]"
              >
                 {/* Card Header */}
                 <div className="flex items-start justify-between mb-4 md:mb-5">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--bg-subtle)] group-hover:bg-[#C1FF00]/10 rounded-xl flex items-center justify-center text-[var(--text)] transition-colors border border-[var(--border)] group-hover:border-[#C1FF00]/30 shadow-sm">
                     <FileText size={18} className="md:w-5 md:h-5" />
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider bg-[var(--bg-subtle)] px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-[var(--border)]">
                     <Calendar size={10} strokeWidth={2.5} />
                     {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
                   </div>
                 </div>

                 {/* Content */}
                 <div className="space-y-1.5 md:space-y-2 mb-5 md:mb-6 flex-1">
                   <h3 className="text-[15px] md:text-[17px] font-bold text-[var(--text)] tracking-tight line-clamp-1">
                     {resume.job_title || "Tailored Resume"}
                   </h3>
                   <p className="text-[var(--text-secondary)] text-[13px] md:text-[13.5px] line-clamp-2 leading-relaxed font-medium">
                      {resume.job_description}
                   </p>
                 </div>

                 {/* Actions */}
                 <ResumeActions resume={resume} />

                 {/* Decorative background element */}
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#C1FF00]/5 rounded-full blur-2xl group-hover:bg-[#C1FF00]/10 transition-all duration-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
