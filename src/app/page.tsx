import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Sparkles, Zap, Brain, Download, ClipboardPaste } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/create");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 md:px-16 py-5 border-b border-[#f0f0f0]">
        <Link href="/" className="text-lg font-bold text-[#1a1a1a] tracking-tight flex items-center">
          Jobing AI
        </Link>
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <SignInButton>
                <button className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
                  Login
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="btn-primary px-5 py-2.5 text-sm">
                  Get Started Now
                </button>
              </SignUpButton>
            </>
          ) : (
            <Link href="/profile" className="btn-primary px-5 py-2.5 text-sm">
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[2.75rem] md:text-[3.5rem] font-extrabold tracking-tight leading-[1.15] text-[#1a1a1a] mb-5">
            AI Resume Builder for
            <br />
            Job Seekers & Professionals
          </h1>

          <p className="text-base md:text-lg text-[#6b7280] max-w-xl mx-auto mb-10 leading-relaxed">
            Create tailored, professional resumes instantly with AI. Paste a job description, get a perfectly formatted LaTeX PDF — no design skills needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!user ? (
              <SignUpButton>
                <button className="btn-primary px-7 py-3.5 text-sm font-semibold gap-2">
                  Get Started Now
                  <ArrowRight size={16} />
                </button>
              </SignUpButton>
            ) : (
              <Link href="/create" className="btn-primary px-7 py-3.5 text-sm font-semibold gap-2">
                Create Resume
                <ArrowRight size={16} />
              </Link>
            )}
            <Link href="#how-it-works" className="btn-secondary px-7 py-3.5 text-sm">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="pb-8 px-6">
        <div className="flex items-center justify-center gap-2">
          {[
            { label: "Profile Builder", icon: "🧠", active: false },
            { label: "Resume AI", icon: "✨", active: false },
            { label: "PDF Export", icon: "📄", active: true },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab.active
                  ? "bg-[#1a1a1a] text-white shadow-sm"
                  : "bg-white border border-[#e5e5e5] text-[#6b7280] hover:border-[#d4d4d4]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Dashboard Preview Placeholder */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[#e5e5e5] bg-gradient-to-br from-[#fafafa] to-[#f0f0ff] p-1 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <div className="rounded-xl bg-white border border-[#f0f0f0] h-72 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#C1FF00]/20 flex items-center justify-center mx-auto">
                  <FileText size={28} className="text-[#1a1a1a]" />
                </div>
                <p className="text-sm text-[#9ca3af]">Your AI-generated resume preview appears here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mb-4 tracking-tight">Three Simple Steps</h2>
            <p className="text-[#6b7280] text-base max-w-md mx-auto">From job posting to polished PDF in under a minute.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Brain,
                title: "Build Your Profile",
                desc: "Chat with our AI assistant to add your education, experience, skills, and projects.",
              },
              {
                step: "02",
                icon: ClipboardPaste,
                title: "Paste Job Description",
                desc: "Copy any job posting from LinkedIn, Indeed, or anywhere else and paste it in.",
              },
              {
                step: "03",
                icon: Download,
                title: "Download Resume",
                desc: "Get a beautifully typeset LaTeX PDF resume, perfectly tailored to the job.",
              },
            ].map((item) => (
              <div key={item.step} className="card p-7 group">
                <div className="w-11 h-11 rounded-xl bg-[#C1FF00]/20 flex items-center justify-center mb-5 group-hover:bg-[#C1FF00]/30 transition-colors">
                  <item.icon size={20} className="text-[#1a1a1a]" />
                </div>
                <div className="text-[10px] font-bold text-[#9ca3af] mb-2 tracking-[0.2em] uppercase">Step {item.step}</div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mb-4 tracking-tight">Why Jobing AI</h2>
            <p className="text-[#6b7280] text-base max-w-md mx-auto">Everything you need to stand out in the job market.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Sparkles, title: "AI-Tailored Content", desc: "Each resume is uniquely crafted to match the specific job description and requirements." },
              { icon: FileText, title: "LaTeX Typography", desc: "Professional-grade typesetting that makes your resume look polished and ATS-friendly." },
              { icon: Zap, title: "Instant Generation", desc: "From paste to PDF in under 30 seconds. No formatting, no templates, no hassle." },
              { icon: Download, title: "One-Click Download", desc: "Preview your resume in-browser and download the production-ready PDF instantly." },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f4] flex items-center justify-center shrink-0">
                  <feature.icon size={18} className="text-[#1a1a1a]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a] mb-1 text-[15px]">{feature.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#1a1a1a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Ready to Land Your Dream Job?</h2>
          <p className="text-[#9ca3af] text-base mb-8 max-w-md mx-auto">
            Join thousands of job seekers who build perfect resumes with AI.
          </p>
          {!user ? (
            <SignUpButton>
              <button className="btn-primary px-8 py-3.5 text-sm font-semibold gap-2">
                Get Started — It&apos;s Free
                <ArrowRight size={16} />
              </button>
            </SignUpButton>
          ) : (
            <Link href="/create" className="btn-primary px-8 py-3.5 text-sm font-semibold gap-2">
              Create Your Resume
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#f0f0f0] bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9ca3af]">
          <div className="flex items-center text-[#1a1a1a] font-semibold">
            Jobing AI
          </div>
          <p>&copy; {new Date().getFullYear()} Jobing AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
