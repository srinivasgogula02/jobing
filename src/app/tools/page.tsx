import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Copy, FileText, ArrowRight, Clock, Star, Zap } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

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

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#C1FF00]/30 flex flex-col">
      {/* ─────── Nav ─────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
          <Link href="/" className="text-lg font-extrabold text-[#1a1a1a] tracking-tight">
            Jobing AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <Link href="/#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</Link>
            <Link href="/tools" className="text-[#1a1a1a] font-bold">Tools</Link>
            <Link href="/#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2.5">
            <SignInButton forceRedirectUrl="/create">
              <button className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors hidden sm:block">
                Login
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/create">
              <button className="btn-primary px-5 py-2.5 text-sm font-bold bg-[#C1FF00] text-black rounded-lg hover:shadow-lg hover:shadow-[#C1FF00]/20 transition-all">
                Get Started
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <header className="pt-20 pb-16 px-5 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C1FF00]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-[3.25rem] leading-[1.1] font-extrabold text-[#1a1a1a] tracking-tight mb-6">
            Free tools to move <span className="bg-[#C1FF00] px-2 py-0.5 rounded leading-none inline-block mt-1">faster.</span>
          </h1>
          <p className="text-[#6b7280] text-lg font-medium max-w-xl mx-auto leading-relaxed">
            We are building a suite of high-performance micro-utilities designed to take the friction out of your daily workflows.
          </p>
        </div>
      </header>

      {/* ─────── Grid ─────── */}
      <main className="max-w-5xl mx-auto px-5 w-full flex-1 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tool 1: Jobing Clipboard */}
          <Link href="/copy" className="group rounded-2xl bg-white border border-[#e5e5e5] hover:border-[#1a1a1a] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500 blur-xl"/>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-[14px] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300 relative z-10">
                <Copy size={24} />
              </div>
              <span className="bg-[#C1FF00] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm relative z-10">
                Live
              </span>
            </div>
            <h3 className="text-[22px] font-extrabold text-[#1a1a1a] mb-3 tracking-tight relative z-10">Jobing Clipboard</h3>
            <p className="text-sm text-[#6b7280] font-medium leading-relaxed mb-6 flex-1 relative z-10">
              Instantly sync and share text online across devices. Create custom short URLs, or use stealth mode for secure sharing. No login required.
            </p>
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors relative z-10">
              Try /copy <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 2: ATS Resume Tailor */}
          <Link href="/create" className="group rounded-2xl bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#C1FF00] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.2)] hover:shadow-2xl hover:shadow-[#C1FF00]/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C1FF00]/10 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500 blur-xl"/>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-[14px] bg-[#C1FF00] text-[#1a1a1a] flex items-center justify-center shadow-lg shadow-[#C1FF00]/20 group-hover:scale-105 transition-transform duration-300 relative z-10">
                <FileText size={24} />
              </div>
              <span className="bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full relative z-10 backdrop-blur-md">
                Core Product
              </span>
            </div>
            <h3 className="text-[22px] font-extrabold text-white mb-3 tracking-tight relative z-10">Resume Tailor</h3>
            <p className="text-sm text-[#9ca3af] font-medium leading-relaxed mb-6 flex-1 relative z-10">
              Paste any job description and let AI completely rewrite your resume to beat the ATS and get shortlisted instantly.
            </p>
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#C1FF00] group-hover:text-[#d4ff4d] transition-colors relative z-10">
              Launch App <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 3: Upcoming Analyzer */}
          <div className="group rounded-2xl bg-white/50 border border-dashed border-[#e5e5e5] p-6 flex flex-col relative overflow-hidden opacity-80 isolate transition-opacity hover:opacity-100 hover:bg-white cursor-default">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-[14px] bg-neutral-100 text-neutral-400 flex items-center justify-center">
                <Star size={24} />
              </div>
              <span className="bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Clock size={12} /> Coming Soon
              </span>
            </div>
            <h3 className="text-[22px] font-extrabold text-[#1a1a1a] mb-3 tracking-tight">LinkedIn Grader</h3>
            <p className="text-sm text-[#6b7280] font-medium leading-relaxed mb-6 flex-1">
              Connect your LinkedIn profile and get an instant AI breakdown of SEO gaps, missing keywords, and optimization techniques.
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-400">
              In Development
            </div>
          </div>

        </div>
      </main>

      {/* ─────── Footer ─────── */}
      <footer className="py-8 px-5 border-t border-[#f0f0f0] bg-white mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#9ca3af] font-medium">
          <div>&copy; {new Date().getFullYear()} Jobing AI.</div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[#1a1a1a] transition-colors">Home</Link>
            <Link href="/#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</Link>
            <Link href="/copy" className="text-[#1a1a1a] hover:text-black transition-colors">Clipboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
