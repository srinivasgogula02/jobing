import { Metadata } from "next";
import Link from "next/link";
import { Copy, FileText, ArrowRight, Clock, Sparkles, BookOpen, Code } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { auth } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Free AI Career & Productivity Tools | Jobing AI",
  description: "A suite of powerful, free micro-tools by Jobing AI designed to accelerate your career and workflows. Explore Jobing Clipboard, Resume Tailor, and more.",
  keywords: ["free career tools", "AI resume builder", "online clipboard", "Jobing AI tools", "productivity tools", "stealth notes", "ATS resume maker"],
  openGraph: {
    title: "Free AI Career & Productivity Tools | Jobing AI",
    description: "Accelerate your career and daily workflows with our suite of free, high-performance micro-utilities. No login required for standard tools.",
    url: "https://jobing.site/tools",
    siteName: "Jobing AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Free AI Career Tools | Jobing AI",
    description: "Explore Jobing AI's suite of free utilities including Jobing Clipboard and ATS Resume Tailor.",
  }
};

export const revalidate = 3600;

export default async function ToolsPage() {
  const { userId } = await auth();

  const ResumeBuilderCardContent = (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(193,255,0,0.07),transparent_70%)] pointer-events-none" />
      
      <div className="flex flex-col gap-4 relative z-10 flex-1">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-none bg-[#C1FF00] text-[#1a1a1a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <FileText size={22} />
          </div>
          <span className="bg-[#C1FF00] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none">Featured</span>
        </div>
        
        <div className="flex flex-col mt-2 text-left">
          <h3 className="text-lg font-extrabold text-white tracking-tight group-hover:text-[#C1FF00] transition-colors mb-1.5">AI Resume Builder</h3>
          <p className="text-[13px] text-[#9ca3af] font-medium leading-relaxed">
            Paste your target job description and let the AI core completely rewrite your profile to obliterate ATS algorithms automatically and{" "}
            <span className="text-[#C1FF00] font-bold">get hired faster</span>.
          </p>
        </div>
      </div>

      <div className="w-full mt-6 relative z-10">
        <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#1a1a1a] bg-[#C1FF00] group-hover:bg-[#d4ff33] transition-colors py-3 px-5 rounded-none">
          Build Resume <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </>
  );

  return (
    <DashboardLayout breadcrumbs={[{ label: "Tools", href: "/tools" }]}>
      {/* 
        Fully flush container: no outer padding, no max-width constraints. 
        It naturally bleeds into the sidebar and header. 
      */}
      <div className="flex flex-col h-full w-full">
        {/* 
          Fluid, responsive grid using auto-fill/auto-fit mechanics 
          (or responsive breakpoints for precise control).
          Gap establishes the 1px grid borders. 
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 border-t border-b border-[#e5e5e5] w-full bg-transparent">

          {/* Tool 0 [FEATURED]: AI Resume Builder */}
          {userId ? (
            <Link
              href="/create"
              className="group flex flex-col justify-between p-6 md:p-8 bg-[#1a1a1a] hover:bg-black transition-colors min-h-[300px] md:min-h-[340px] relative overflow-hidden border-b border-r border-[#e5e5e5]"
            >
              {ResumeBuilderCardContent}
            </Link>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/create">
              <button className="group flex flex-col justify-between p-6 md:p-8 bg-[#1a1a1a] hover:bg-black transition-colors min-h-[300px] md:min-h-[340px] relative overflow-hidden text-left h-full border-b border-r border-[#e5e5e5] focus:outline-none focus:ring-0">
                {ResumeBuilderCardContent}
              </button>
            </SignUpButton>
          )}

          {/* Tool 1: Jobing Clipboard - Indigo Palette */}
          <Link href="/copy" className="group flex flex-col justify-between p-6 md:p-8 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors min-h-[300px] md:min-h-[340px] relative overflow-hidden border-b border-r border-[#e5e5e5]">
            <div className="flex flex-col gap-4 flex-1">
               <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-none bg-[#1e1b4b] text-[#818cf8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Copy size={22} />
                 </div>
                 <span className="bg-[#818cf8]/15 text-[#4f46e5] border border-[#818cf8]/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none">Live</span>
               </div>
               
               <div className="flex flex-col mt-2">
                 <h3 className="text-lg font-extrabold text-[#0f172a] tracking-tight group-hover:text-[#4f46e5] transition-colors mb-1.5">Jobing Clipboard</h3>
                 <p className="text-[13px] text-[#475569] font-medium leading-relaxed">
                   Instantly sync and share text online across devices. Built with native custom short URLs, offline stealth UI routing, and sub-millisecond memory bounds. No login required.
                 </p>
               </div>
            </div>

            <div className="w-full mt-6">
               <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#4f46e5] group-hover:text-white transition-colors py-3 px-5 rounded-none bg-[#4f46e5]/10 group-hover:bg-[#4f46e5]">
                 Create notes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
          </Link>

          {/* Tool X: HTML Viewer - Lime Green Palette */}
          <Link href="/pages" className="group flex flex-col justify-between p-6 md:p-8 bg-[#f7fee7] hover:bg-[#ecfccb] transition-colors min-h-[300px] md:min-h-[340px] relative overflow-hidden border-b border-r border-[#e5e5e5]">
            <div className="flex flex-col gap-4 flex-1">
               <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-none bg-[#3f6212] text-[#a3e635] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Code size={22} />
                 </div>
                 <span className="bg-[#a3e635]/15 text-[#65a30d] border border-[#a3e635]/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none">Live</span>
               </div>
               
               <div className="flex flex-col mt-2">
                 <h3 className="text-lg font-extrabold text-[#14532d] tracking-tight group-hover:text-[#65a30d] transition-colors mb-1.5">HTML Online Viewer</h3>
                 <p className="text-[13px] text-[#3f6212]/70 font-medium leading-relaxed">
                   Fast HTML editor with instant live preview. View, edit, and experiment with your HTML code in real-time. 100% private, no login required.
                 </p>
               </div>
            </div>

            <div className="w-full mt-6">
               <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#65a30d] group-hover:text-[#1a1a1a] transition-colors py-3 px-5 rounded-none bg-[#65a30d]/10 group-hover:bg-[#C1FF00]">
                 Open Viewer <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
          </Link>

          {/* Tool 2: LastMinute Custom GPT - Teal/Mint Palette */}
          <a href="https://chatgpt.com/g/g-6941cc3967608191a34b2757e3f3232a-lastminute" target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-6 md:p-8 bg-[#f0fdfa] hover:bg-[#ccfbf1] transition-colors min-h-[300px] md:min-h-[340px] relative overflow-hidden border-b border-r border-[#e5e5e5]">
            <div className="flex flex-col gap-4 flex-1">
               <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-none bg-[#0f766e] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <BookOpen size={22} />
                 </div>
                 <span className="bg-[#ccfbf1] text-[#0f766e] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border border-[#5eead4]">Custom GPT</span>
               </div>
               
               <div className="flex flex-col mt-2">
                 <h3 className="text-lg font-extrabold text-[#115e59] tracking-tight group-hover:text-[#0f766e] transition-colors mb-1.5">LastMinute</h3>
                 <p className="text-[13px] text-[#0f766e]/70 font-medium leading-relaxed">
                   Upload any study PDF and get a one-page A4 exam revision sheet. Just what you need before exams.
                 </p>
               </div>
            </div>

            <div className="w-full mt-6">
               <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#0f766e] group-hover:text-[#042f2e] transition-colors py-3 px-5 rounded-none bg-white group-hover:bg-[#99f6e4]">
                 Add to ChatGPT <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
          </a>

          {/* More Coming Soon - Amber Palette */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#fffbeb] hover:bg-[#fef3c7] min-h-[300px] md:min-h-[340px] group transition-colors cursor-default border-b border-r border-[#e5e5e5]">
             <Clock size={32} className="text-[#fbbf24] mb-3 group-hover:text-[#d97706] transition-colors" />
             <p className="text-[14px] font-semibold text-[#d97706] text-center">
               More tools<br />coming soon
             </p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
