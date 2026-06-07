import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Sparkles,
  Zap,
  Brain,
  Download,
  ClipboardPaste,
  Shield,
  ChevronDown,
  Target,
  BarChart3,
  Users,
  Star,
  CheckCircle2,
  Mail,
  RefreshCw,
  Globe,
  Code
} from "lucide-react";
import Link from "next/link";
import { CopyPasteAnimation } from "@/components/CopyPasteAnimation";
import { Pricing } from "@/components/Pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/tools");

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-[#C1FF00] selection:text-black">
      {/* ─────── Top Announcement Banner ─────── */}
      <div className="w-full bg-[#1a1a1a] text-white px-4 py-2.5 flex items-center justify-center relative z-[60] border-b border-black">
        <div className="group flex flex-wrap items-center justify-center text-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-medium">
          <span className="hidden sm:flex items-center justify-center bg-[#C1FF00] text-[#1a1a1a] px-2 py-[2px] rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_8px_rgba(193,255,0,0.4)] animate-pulse">
            LIVE
          </span>
          <span className="opacity-95 text-neutral-200">
            Join 11,000+ users deploying AI agents to automate their job search.
          </span>
          <SignUpButton forceRedirectUrl="/tools">
            <button className="text-[#C1FF00] flex items-center gap-1 font-bold whitespace-nowrap hover:opacity-80 transition-opacity">
              Deploy Your AI <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </SignUpButton>
        </div>
      </div>

      {/* ─────── SEO & GEO JSON-LD ─────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Jobing AI",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Deploy your own AI Agent to find jobs, write customized resumes, and email recruiters while you sleep."
          })
        }}
      />

      {/* ─────── Nav ─────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
          <Link href="/" className="text-lg font-extrabold text-[#1a1a1a] tracking-tight flex items-center gap-2">
            <Brain size={20} className="text-[#8bb800]" />
            Jobing AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <a href="#ecosystem" className="hover:text-[#1a1a1a] transition-colors">The Ecosystem</a>
            <a href="#free-tools" className="hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5 font-bold">
              Free Tools <span className="bg-[#C1FF00] text-[#1a1a1a] text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider leading-none shadow-[0_0_4px_rgba(193,255,0,0.5)]">New</span>
            </a>
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <SignInButton forceRedirectUrl="/tools">
              <button className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors hidden sm:block">
                Login
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/tools">
              <button className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2">
                Deploy Agent
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="pt-16 md:pt-28 pb-16 px-5 text-center relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#C1FF00]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-20 -right-40 w-[400px] h-[400px] bg-[#C1FF00]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="inline-flex mx-auto items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] shadow-sm mb-8">
            <span className="flex items-center justify-center bg-[#C1FF00]/20 rounded-full p-1">
              <Sparkles size={12} className="text-[#8bb800]" />
            </span>
            <span className="text-[13px] font-medium text-[#6b7280]">
              Trusted by <strong className="text-[#1a1a1a]">11,000+</strong> users worldwide
            </span>
          </div>

          <h1 className="text-[2rem] sm:text-5xl lg:text-[4.5rem] font-black tracking-tighter leading-[1.05] text-[#1a1a1a] mb-6">
            The Only Platform You Need
            <br className="hidden md:block" />
            <span className="relative inline-block mt-2">
              <span className="relative z-10">To Get Hired.</span>
              <span className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-3 sm:h-4 bg-[#C1FF00]/40 -z-0 rounded-sm" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Stop manually tweaking resumes. Deploy an <strong className="text-[#1a1a1a]">AI Agent</strong> that finds matching jobs, drafts customized resumes, and emails recruiters for you. 
            <br className="hidden sm:block mt-2" />
            The AI that gets you hired while you're sleeping.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <SignUpButton forceRedirectUrl="/tools">
              <button className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl shadow-lg shadow-[#C1FF00]/25 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto">
                <Brain size={18} />
                Deploy Your AI Agent Now
              </button>
            </SignUpButton>
            <a href="#ecosystem" className="btn-secondary px-8 py-4 text-base font-bold rounded-xl w-full sm:w-auto">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ─────── The FOMO Section ─────── */}
      <section className="py-12 px-5 border-y border-[#f0f0f0] bg-[#fafafa]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#6b7280] text-lg sm:text-xl font-medium leading-relaxed max-w-3xl mx-auto italic">
            "While you spend 3 hours tweaking a single resume, another candidate's AI just perfectly tailored and submitted 50 applications. <span className="text-[#1a1a1a] font-bold not-italic border-b-2 border-[#C1FF00]">Don't let them take your job.</span>"
          </p>
        </div>
      </section>

      {/* ─────── Company Marquee (Social Proof) ─────── */}
      <section className="py-8 md:py-10 bg-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-5 mb-5 text-center">
          <p className="text-[13px] font-bold text-[#9ca3af] uppercase tracking-widest">
            Our 11k+ Users Have Landed Offers At
          </p>
        </div>
        
        {/* Marquee Container */}
        <div className="relative flex overflow-x-hidden group">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          
          {/* Scrolling Content - Repeated twice for seamless loop */}
          <div className="flex animate-marquee items-center min-w-max py-2">
            {[
              { name: "Google", domain: "google.com" },
              { name: "Microsoft", domain: "microsoft.com" },
              { name: "Amazon", domain: "amazon.com" },
              { name: "TCS", domain: "tcs.com" },
              { name: "Infosys", domain: "infosys.com" },
              { name: "Razorpay", domain: "razorpay.com" },
              { name: "Accenture", domain: "accenture.com" },
              { name: "Zomato", domain: "zomato.com" },
              { name: "Goldman Sachs", domain: "goldmansachs.com" },
              { name: "IBM", domain: "ibm.com" }
            ].map((company, i) => (
              <div 
                key={`${company.name}-${i}`} 
                className="mx-6 md:mx-10 flex items-center gap-2 md:gap-3 opacity-50 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 select-none group/company"
              >
                <img 
                  src={`https://icon.horse/icon/${company.domain}`} 
                  alt={company.name} 
                  className="h-6 w-6 md:h-8 md:w-8 object-contain rounded-[4px] bg-white border border-[#e5e5e5] p-[3px] shadow-sm shrink-0"
                  loading="lazy"
                />
                <span className="text-[18px] md:text-[22px] font-black tracking-tighter text-[#1a1a1a] whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>

          {/* Duplicate for seamless loop */}
          <div className="flex animate-marquee items-center min-w-max py-2" aria-hidden="true">
            {[
              { name: "Google", domain: "google.com" },
              { name: "Microsoft", domain: "microsoft.com" },
              { name: "Amazon", domain: "amazon.com" },
              { name: "TCS", domain: "tcs.com" },
              { name: "Infosys", domain: "infosys.com" },
              { name: "Razorpay", domain: "razorpay.com" },
              { name: "Accenture", domain: "accenture.com" },
              { name: "Zomato", domain: "zomato.com" },
              { name: "Goldman Sachs", domain: "goldmansachs.com" },
              { name: "IBM", domain: "ibm.com" }
            ].map((company, i) => (
              <div 
                key={`dup-${company.name}-${i}`} 
                className="mx-6 md:mx-10 flex items-center gap-2 md:gap-3 opacity-50 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 select-none group/company"
              >
                <img 
                  src={`https://icon.horse/icon/${company.domain}`} 
                  alt={company.name} 
                  className="h-6 w-6 md:h-8 md:w-8 object-contain rounded-[4px] bg-white border border-[#e5e5e5] p-[3px] shadow-sm shrink-0"
                  loading="lazy"
                />
                <span className="text-[18px] md:text-[22px] font-black tracking-tighter text-[#1a1a1a] whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── The AI Ecosystem Pipeline (How It Works) ─────── */}
      <section id="ecosystem" className="py-16 md:py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              THE PIPELINE
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Your Entire Career Hunt. <br className="hidden md:block" />
              <span className="bg-[#C1FF00] px-2 py-0.5 rounded">Automated by AI.</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto font-medium">
              We don't just give you a resume template. We give you a digital brain that executes the entire hiring pipeline for you.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[50px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[#e5e5e5] to-transparent z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Context Sync",
                  desc: "Tell the AI who you are. Upload your past resume or chat directly.",
                },
                {
                  step: "02",
                  icon: Target,
                  title: "Job Discovery",
                  desc: "Our AI scrapes and finds the perfect matching jobs for your profile.",
                },
                {
                  step: "03",
                  icon: FileText,
                  title: "Auto-Tailoring",
                  desc: "Drafts hyper-customized, ATS-beating resumes for every single role.",
                },
                {
                  step: "04",
                  icon: Mail,
                  title: "Outreach",
                  desc: "Mails recruiters and hiring managers directly on your behalf.",
                },
                {
                  step: "05",
                  icon: RefreshCw,
                  title: "Loop & Update",
                  desc: "Keeps you in the loop with daily summaries while you sleep.",
                },
              ].map((item, index) => (
                <div key={item.step} className="flex flex-col items-center text-center group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-[#e5e5e5] flex flex-col items-center justify-center mb-6 relative group-hover:border-[#C1FF00] group-hover:shadow-[0_0_20px_rgba(193,255,0,0.2)] transition-all">
                    <span className="absolute -top-3 bg-white border border-[#e5e5e5] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:text-[#1a1a1a] group-hover:border-[#C1FF00] group-hover:bg-[#C1FF00] transition-colors">
                      {item.step}
                    </span>
                    <item.icon size={28} className="text-[#6b7280] group-hover:text-[#1a1a1a] transition-colors mb-1" />
                  </div>
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6b7280] leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Stats & Traction ─────── */}
      <section className="py-16 md:py-20 px-5 bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { value: "11,200+", label: "Active AI Agents", icon: Brain },
              { value: "100k+", label: "Resumes Tailored", icon: FileText },
              { value: "87%", label: "Callback Rate", icon: BarChart3 },
              { value: "1,500+", label: "Offers Accepted", icon: Target },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-[#C1FF00]/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#C1FF00]/30 transition-colors">
                  <stat.icon size={20} className="text-[#C1FF00]" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-[#9ca3af] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Free Top-of-Funnel Tools ─────── */}
      <section id="free-tools" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              THE ECOSYSTEM
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Explore Our Free Tools
            </h2>
            <p className="text-[#6b7280] text-lg max-w-lg mx-auto font-medium">
              We build tools that make developers and job seekers faster. Completely free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/pages" className="card block p-8 group hover:border-[#C1FF00] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center mb-6 transition-colors">
                <Globe size={24} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Jobing Pages</h3>
              <p className="text-[#6b7280] leading-relaxed mb-6">
                Host your portfolio, resume, or links instantly with a custom short URL. Zero setup, zero hosting fees. Live in 5 seconds.
              </p>
              <div className="flex items-center text-[#1a1a1a] font-bold text-sm">
                Create a Page <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            <Link href="/copy" className="card block p-8 group hover:border-[#C1FF00] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center mb-6 transition-colors">
                <Code size={24} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Jobing Notepad</h3>
              <p className="text-[#6b7280] leading-relaxed mb-6">
                A stealthy, dark-mode notepad to instantly sync and share code snippets or texts across devices without logging in.
              </p>
              <div className="flex items-center text-[#1a1a1a] font-bold text-sm">
                Start Typing <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────── Copy and Paste Animation ─────── */}
      <div className="py-10 bg-white">
        <CopyPasteAnimation />
      </div>

      {/* ─────── Price Anchoring & Pricing ─────── */}
      <section id="pricing" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              An Entire AI Hiring Team. <br className="md:hidden" />
              <span className="bg-[#C1FF00] px-2 py-0.5 rounded">Less Than Your Netflix.</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto font-medium">
              50 tailored resumes, automated outreach, and 24/7 job hunting. Less than everyday things you already spend on.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto mb-16">
            {[
              { emoji: "☕", label: "2 chai lattes", sub: "at any café" },
              { emoji: "🍗", label: "A single biryani", sub: "from Swiggy" },
              { emoji: "📱", label: "Mobile recharge", sub: "monthly plan" },
              { emoji: "💼", label: "1 day of Premium", sub: "seriously." },
            ].map((item) => (
              <div
                key={item.label}
                className="card p-5 md:p-6 text-center group hover:border-[#C1FF00] transition-all"
              >
                <div className="text-3xl md:text-4xl mb-3">{item.emoji}</div>
                <p className="text-sm md:text-[15px] font-bold text-[#1a1a1a] mb-1">
                  Less than {item.label}
                </p>
                <p className="text-xs text-[#9ca3af]">{item.sub}</p>
              </div>
            ))}
          </div>

          <Pricing />
        </div>
      </section>

      {/* ─────── Social Proof ─────── */}
      <section className="py-16 md:py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Don't Take Our Word For It
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I literally woke up to 3 interview invites in my inbox. The AI tailored my resume and emailed the recruiters while I was asleep.",
                name: "Priya S.",
                role: "SDE @ Amazon",
                stars: 5,
              },
              {
                quote: "I was sending 100s of manual applications and getting ghosted. Jobing AI took over and my callback rate shot up to 80%.",
                name: "Rahul M.",
                role: "Frontend Dev @ Razorpay",
                stars: 5,
              },
              {
                quote: "₹249/month to literally have an AI agent act as my personal hiring manager? Absolute no-brainer.",
                name: "Ananya K.",
                role: "Data Analyst @ Flipkart",
                stars: 5,
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="card p-8 group hover:border-[#C1FF00] transition-colors">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} size={16} className="text-[#C1FF00] fill-[#C1FF00]" />
                  ))}
                </div>
                <p className="text-[#1a1a1a] leading-relaxed mb-6 font-medium text-[15px]">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="text-base font-bold text-[#1a1a1a]">{testimonial.name}</p>
                  <p className="text-sm text-[#6b7280]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="py-20 md:py-28 px-5 bg-[#1a1a1a] border-t border-[#f0f0f0] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C1FF00]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Stop Searching.<br />
            Start Deploying.
          </h2>
          <p className="text-[#9ca3af] text-lg md:text-xl mb-10 max-w-lg mx-auto font-medium">
            Join 11,000+ professionals who stopped getting ghosted and started getting hired.
          </p>
          <SignUpButton forceRedirectUrl="/tools">
            <button className="btn-primary flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold shadow-[0_0_30px_rgba(193,255,0,0.2)] hover:shadow-[0_0_50px_rgba(193,255,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all mx-auto">
              <Brain size={20} />
              Deploy Your AI Agent Now
            </button>
          </SignUpButton>
          <p className="mt-6 text-sm text-[#6b7280]">Instant access · Cancel anytime</p>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="py-10 px-5 border-t border-[#f0f0f0] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-[#8bb800]" />
              <span className="font-extrabold text-[#1a1a1a] text-lg">Jobing AI</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-[#6b7280]">
              <a href="#ecosystem" className="hover:text-[#1a1a1a] transition-colors">The Ecosystem</a>
              <Link href="/pages" className="hover:text-[#1a1a1a] transition-colors">Jobing Pages</Link>
              <Link href="/copy" className="hover:text-[#1a1a1a] transition-colors">Jobing Notepad</Link>
              <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center text-sm text-[#9ca3af]">
            &copy; {new Date().getFullYear()} Jobing AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
