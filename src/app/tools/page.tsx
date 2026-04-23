import { Metadata } from "next";
import Link from "next/link";
import { Copy, FileText, ArrowRight, Clock, Sparkles } from "lucide-react";
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
      <div className="flex flex-col h-full w-full max-w-5xl p-4 md:p-8 lg:p-10">

        <div className="flex flex-col space-y-4 w-full">

          {/* Tool 0 [FEATURED]: AI Resume Builder */}
          <Link
            href="/create"
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-[#1a1a1a] border border-[#C1FF00]/30 hover:border-[#C1FF00] rounded-2xl shadow-lg hover:shadow-[0_0_32px_rgba(193,255,0,0.15)] transition-all gap-5 sm:gap-8 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(193,255,0,0.07),transparent_70%)] pointer-events-none" />
            <div className="flex items-start sm:items-center gap-5 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#C1FF00] text-[#1a1a1a] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[17px] sm:text-lg font-extrabold text-white tracking-tight group-hover:text-[#C1FF00] transition-colors">AI Resume Builder</h3>
                  <span className="bg-[#C1FF00] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">Featured</span>
                </div>
                <p className="text-[13.5px] sm:text-[14px] text-[#9ca3af] font-medium leading-relaxed max-w-2xl">
                  Paste your target job description and let the AI core completely rewrite your profile to obliterate ATS algorithms automatically and{" "}
                  <span className="text-[#C1FF00] font-bold">get hired faster</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0 relative z-10">
              <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[13.5px] sm:text-[14px] font-bold text-[#1a1a1a] bg-[#C1FF00] group-hover:bg-[#d4ff33] transition-colors py-2 px-5 rounded-lg shadow">
                Build Resume <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
            {/* Edge glow */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C1FF00] opacity-40 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* Tool 1: Jobing Clipboard */}
          <Link href="/copy" className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white border border-[#e5e5e5] hover:border-[#C1FF00] rounded-2xl shadow-sm hover:shadow-md transition-all gap-5 sm:gap-8 relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-5">
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1a1a1a] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Copy size={24} className="text-white" />
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-[17px] sm:text-lg font-extrabold text-[#1a1a1a] tracking-tight group-hover:text-[#8bb800] transition-colors">Jobing Clipboard</h3>
                   <span className="bg-[#1a1a1a] text-[#C1FF00] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">Live</span>
                 </div>
                 <p className="text-[13.5px] sm:text-[14px] text-[#6b7280] font-medium leading-relaxed max-w-2xl">
                   Instantly sync and share text online across devices. Built with native custom short URLs, offline stealth UI routing, and sub-millisecond memory bounds. No login required.
                 </p>
               </div>
            </div>
            <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
               <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-[13.5px] sm:text-[14px] font-bold text-[#1a1a1a] group-hover:text-[#4f46e5] transition-colors py-2 px-4 rounded-lg bg-[#f5f5f4] group-hover:bg-indigo-50">
                 Create notes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </span>
            </div>
            {/* Edge glow indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C1FF00] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* More Coming Soon */}
          <div className="flex items-center justify-center p-8 mt-4 border border-dashed border-[#e5e5e5] rounded-2xl bg-[#fafafa] opacity-60">
            <p className="text-[14px] font-semibold text-[#9ca3af] flex items-center gap-2">
              <Clock size={16} /> More native tools coming soon
            </p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
