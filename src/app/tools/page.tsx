import { Metadata } from "next";
import Link from "next/link";
import { Copy, FileText, ArrowRight, Clock, Sparkles, BookOpen } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

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

export default function ToolsPage() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-[#e5e5e5] w-full border-b border-[#e5e5e5]">

          {/* Tool 0 [FEATURED]: AI Resume Builder */}
          <Link
            href="/create"
            className="group flex flex-col justify-between p-6 bg-[#1a1a1a] hover:bg-black transition-colors aspect-auto sm:aspect-square min-h-[300px] sm:min-h-0 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(193,255,0,0.07),transparent_70%)] pointer-events-none" />
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-none bg-[#C1FF00] text-[#1a1a1a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <FileText size={22} />
                </div>
                <span className="bg-[#C1FF00] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none">Featured</span>
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-lg font-extrabold text-white tracking-tight group-hover:text-[#C1FF00] transition-colors mb-1">AI Resume Builder</h3>
                <p className="text-[13px] text-[#9ca3af] font-medium leading-relaxed sm:line-clamp-4 line-clamp-none">
                  Paste your target job description and let the AI core completely rewrite your profile to obliterate ATS algorithms automatically and{" "}
                  <span className="text-[#C1FF00] font-bold">get hired faster</span>.
                </p>
              </div>
            </div>

            <div className="w-full mt-auto relative z-10 pt-6">
              <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#1a1a1a] bg-[#C1FF00] group-hover:bg-[#d4ff33] transition-colors py-3 px-5 rounded-none">
                Build Resume <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Tool 1: Jobing Clipboard */}
          <Link href="/copy" className="group flex flex-col justify-between p-6 bg-white hover:bg-[#fafafa] transition-colors aspect-auto sm:aspect-square min-h-[300px] sm:min-h-0 relative overflow-hidden">
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-none bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Copy size={22} className="text-white" />
                 </div>
                 <span className="bg-[#1a1a1a] text-[#C1FF00] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none">Live</span>
               </div>
               
               <div className="flex flex-col">
                 <h3 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight group-hover:text-[#8bb800] transition-colors mb-1">Jobing Clipboard</h3>
                 <p className="text-[13px] text-[#6b7280] font-medium leading-relaxed sm:line-clamp-4 line-clamp-none">
                   Instantly sync and share text online across devices. Built with native custom short URLs, offline stealth UI routing, and sub-millisecond memory bounds. No login required.
                 </p>
               </div>
            </div>

            <div className="w-full mt-auto pt-6">
               <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#1a1a1a] group-hover:text-[#4f46e5] transition-colors py-3 px-5 rounded-none bg-[#f5f5f4] group-hover:bg-indigo-50">
                 Create notes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
          </Link>

          {/* Tool 2: LastMinute Custom GPT */}
          <a href="#" target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-6 bg-white hover:bg-[#fafafa] transition-colors aspect-auto sm:aspect-square min-h-[300px] sm:min-h-0 relative overflow-hidden">
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-none bg-[#1a1a1a] text-[#10a37f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <BookOpen size={22} />
                 </div>
                 <span className="bg-[#10a37f]/10 text-[#10a37f] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border border-[#10a37f]/20">Custom GPT</span>
               </div>
               
               <div className="flex flex-col">
                 <h3 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight group-hover:text-[#10a37f] transition-colors mb-1">LastMinute</h3>
                 <p className="text-[13px] text-[#6b7280] font-medium leading-relaxed sm:line-clamp-4 line-clamp-none">
                   Upload any study PDF and get a one-page A4 exam revision sheet. Just what you need before exams.
                 </p>
               </div>
            </div>

            <div className="w-full mt-auto pt-6">
               <span className="flex items-center justify-between w-full text-[13px] font-bold text-[#10a37f] group-hover:text-white transition-colors py-3 px-5 rounded-none bg-[#10a37f]/10 group-hover:bg-[#10a37f]">
                 Add to ChatGPT <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
          </a>

          {/* More Coming Soon */}
          <div className="flex flex-col items-center justify-center p-6 bg-white opacity-80 aspect-auto sm:aspect-square min-h-[300px] sm:min-h-0 group hover:bg-[#fafafa] transition-colors cursor-default">
             <Clock size={32} className="text-[#d1d5db] mb-3 group-hover:text-[#9ca3af] transition-colors" />
             <p className="text-[14px] font-semibold text-[#9ca3af] text-center">
               More tools<br />coming soon
             </p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
