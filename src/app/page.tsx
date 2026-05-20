import { SignInButton, SignUpButton } from "@clerk/nextjs";
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
import { Pricing } from "@/components/Pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 selection:bg-[#C1FF00] selection:text-black font-sans">
      {/* ─────── Top Announcement Banner ─────── */}
      <div className="w-full bg-[#1a1a1a] text-white px-4 py-2.5 flex items-center justify-center relative z-[60] border-b border-[#333]">
        <div className="group flex flex-wrap items-center justify-center text-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-medium">
          <span className="hidden sm:flex items-center justify-center bg-[#C1FF00] text-[#1a1a1a] px-2 py-[2px] rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_8px_rgba(193,255,0,0.4)] animate-pulse">
            LIVE
          </span>
          <span className="opacity-95 text-neutral-300">
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
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
          <Link href="/" className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <Brain className="text-[#C1FF00]" size={20} />
            Jobing AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#ecosystem" className="hover:text-white transition-colors">The Ecosystem</a>
            <a href="#free-tools" className="hover:text-white transition-colors flex items-center gap-1.5 font-bold text-white">Free Tools <span className="bg-[#1a1a1a] border border-[#333] text-[#C1FF00] text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">New</span></a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <SignInButton forceRedirectUrl="/tools">
              <button className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors hidden sm:block">
                Login
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/tools">
              <button className="bg-[#C1FF00] text-black px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-[#aee600] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(193,255,0,0.3)]">
                Deploy Agent
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="pt-20 md:pt-32 pb-16 px-5 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#C1FF00]/10 rounded-[100%] blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="inline-flex mx-auto items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#333] mb-8 group overflow-hidden">
            <span className="flex items-center justify-center bg-[#C1FF00]/20 rounded-full p-1">
              <Sparkles size={12} className="text-[#C1FF00]" />
            </span>
            <span className="text-[13px] font-medium text-neutral-300">
              Trusted by <strong className="text-white">11,000+</strong> users worldwide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black tracking-tighter leading-[1.05] text-white mb-6">
            The Only Platform You Need
            <br className="hidden md:block" />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-[#C1FF00] drop-shadow-[0_0_25px_rgba(193,255,0,0.3)]">To Get Hired.</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Stop manually tweaking resumes. Deploy an <strong className="text-white">AI Agent</strong> that finds matching jobs, drafts customized resumes, and emails recruiters for you. 
            <br className="hidden sm:block mt-2" />
            <span className="text-neutral-300">The AI that gets you hired while you're sleeping.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <SignUpButton forceRedirectUrl="/tools">
              <button className="flex items-center justify-center gap-2 bg-[#C1FF00] text-black px-8 py-4 text-base font-bold rounded-xl shadow-[0_0_30px_rgba(193,255,0,0.4)] hover:shadow-[0_0_50px_rgba(193,255,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto">
                <Brain size={18} />
                Deploy Your AI Agent
              </button>
            </SignUpButton>
            <a href="#ecosystem" className="flex items-center justify-center gap-2 bg-[#1a1a1a] text-white border border-[#333] px-8 py-4 text-base font-bold rounded-xl hover:bg-[#222] transition-colors w-full sm:w-auto">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ─────── The FOMO Section ─────── */}
      <section className="py-12 px-5 border-y border-[#222] bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-neutral-400 text-lg sm:text-xl font-medium leading-relaxed max-w-3xl mx-auto italic">
            "While you spend 3 hours tweaking a single resume, another candidate's AI just perfectly tailored and submitted 50 applications. <span className="text-white font-bold not-italic border-b-2 border-[#C1FF00]">Don't let them take your job.</span>"
          </p>
        </div>
      </section>

      {/* ─────── Company Marquee (Social Proof) ─────── */}
      <section className="py-10 bg-[#0a0a0a] overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-5 mb-6 text-center">
          <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest">
            Our 11k+ Users Have Landed Offers At
          </p>
        </div>
        
        <div className="relative flex overflow-x-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none"></div>
          
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
                className="mx-6 md:mx-10 flex items-center gap-2 md:gap-3 opacity-40 hover:opacity-100 transition-all duration-300 grayscale select-none group/company"
              >
                <img 
                  src={`https://icon.horse/icon/${company.domain}`} 
                  alt={company.name} 
                  className="h-6 w-6 md:h-8 md:w-8 object-contain rounded-[4px] bg-white border border-[#333] p-[3px] shadow-sm shrink-0"
                  loading="lazy"
                />
                <span className="text-[18px] md:text-[22px] font-black tracking-tighter text-neutral-300 whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>

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
                className="mx-6 md:mx-10 flex items-center gap-2 md:gap-3 opacity-40 hover:opacity-100 transition-all duration-300 grayscale select-none group/company"
              >
                <img 
                  src={`https://icon.horse/icon/${company.domain}`} 
                  alt={company.name} 
                  className="h-6 w-6 md:h-8 md:w-8 object-contain rounded-[4px] bg-white border border-[#333] p-[3px] shadow-sm shrink-0"
                  loading="lazy"
                />
                <span className="text-[18px] md:text-[22px] font-black tracking-tighter text-neutral-300 whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── The AI Ecosystem Pipeline (How It Works) ─────── */}
      <section id="ecosystem" className="py-20 md:py-32 px-5 bg-[#0a0a0a] relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#C1FF00]/10 text-[#C1FF00] rounded-full border border-[#C1FF00]/20">
              <Target size={14} /> THE PIPELINE
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Your Entire Career Hunt. <br className="hidden md:block" />
              <span className="text-[#C1FF00]">Automated by AI.</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium">
              We don't just give you a resume template. We give you a digital brain that executes the entire hiring pipeline for you.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[50px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[#333] to-transparent z-0"></div>

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
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#111] border border-[#222] flex flex-col items-center justify-center mb-6 relative group-hover:border-[#C1FF00]/50 group-hover:shadow-[0_0_30px_rgba(193,255,0,0.15)] transition-all">
                    <span className="absolute -top-3 bg-[#1a1a1a] border border-[#333] text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:text-[#C1FF00] group-hover:border-[#C1FF00] transition-colors">
                      {item.step}
                    </span>
                    <item.icon size={28} className="text-neutral-400 group-hover:text-[#C1FF00] transition-colors mb-1" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-[13px] text-neutral-400 leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Stats & Traction ─────── */}
      <section className="py-16 px-5 border-y border-[#222] bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { value: "11,200+", label: "Active AI Agents", icon: Brain },
              { value: "100k+", label: "Resumes Tailored", icon: FileText },
              { value: "87%", label: "Interview Callback Rate", icon: BarChart3 },
              { value: "1,500+", label: "Offers Accepted", icon: Target },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#C1FF00]/10 group-hover:border-[#C1FF00]/30 transition-colors">
                  <stat.icon size={20} className="text-neutral-400 group-hover:text-[#C1FF00] transition-colors" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-neutral-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Free Top-of-Funnel Tools ─────── */}
      <section id="free-tools" className="py-20 md:py-32 px-5 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#1a1a1a] text-neutral-400 rounded-full border border-[#333]">
              THE ECOSYSTEM
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Explore Our Free Tools
            </h2>
            <p className="text-neutral-400 text-lg max-w-lg mx-auto font-medium">
              We build tools that make developers and job seekers faster. Completely free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/pages" className="block bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#C1FF00]/50 hover:bg-[#151515] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} className="text-[#C1FF00]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Jobing Pages</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Host your portfolio, resume, or links instantly with a custom short URL. Zero setup, zero hosting fees. Live in 5 seconds.
              </p>
              <div className="flex items-center text-[#C1FF00] font-bold text-sm">
                Create a Page <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            <Link href="/copy" className="block bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#C1FF00]/50 hover:bg-[#151515] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code size={24} className="text-[#C1FF00]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Jobing Notepad</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                A stealthy, dark-mode notepad to instantly sync and share code snippets or texts across devices without logging in.
              </p>
              <div className="flex items-center text-[#C1FF00] font-bold text-sm">
                Start Typing <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────── Price Anchoring & Pricing ─────── */}
      <section id="pricing" className="py-20 px-5 bg-[#0f0f0f] border-t border-[#222]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              An Entire AI Hiring Team. <br className="md:hidden" />
              <span className="text-[#C1FF00]">Less Than Your Netflix.</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto font-medium">
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
                className="bg-[#111] border border-[#222] rounded-2xl p-5 md:p-6 text-center group hover:border-[#333] transition-all"
              >
                <div className="text-3xl md:text-4xl mb-3">{item.emoji}</div>
                <p className="text-sm md:text-[15px] font-bold text-white mb-1">
                  Less than {item.label}
                </p>
                <p className="text-xs text-neutral-500">{item.sub}</p>
              </div>
            ))}
          </div>

          <Pricing />
        </div>
      </section>

      {/* ─────── Social Proof ─────── */}
      <section className="py-20 md:py-24 px-5 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
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
              <div key={testimonial.name} className="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#333] transition-colors">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} size={16} className="text-[#C1FF00] fill-[#C1FF00]" />
                  ))}
                </div>
                <p className="text-neutral-300 leading-relaxed mb-6 font-medium text-[15px]">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="text-base font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-neutral-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="py-24 md:py-32 px-5 bg-[#0f0f0f] border-t border-[#222] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#C1FF00]/10 rounded-[100%] blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Stop Searching.<br />
            Start <span className="text-[#C1FF00]">Deploying.</span>
          </h2>
          <p className="text-neutral-400 text-lg md:text-xl mb-10 max-w-lg mx-auto font-medium">
            Join 11,000+ professionals who stopped getting ghosted and started getting hired.
          </p>
          <SignUpButton forceRedirectUrl="/tools">
            <button className="bg-[#C1FF00] text-black px-10 py-5 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(193,255,0,0.3)] hover:shadow-[0_0_50px_rgba(193,255,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto">
              <Brain size={20} />
              Deploy Your AI Agent Now
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="py-12 px-5 border-t border-[#222] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Brain className="text-[#C1FF00]" size={20} />
              <span className="font-extrabold text-white text-lg">Jobing AI</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-neutral-500">
              <a href="#ecosystem" className="hover:text-white transition-colors">The Ecosystem</a>
              <Link href="/pages" className="hover:text-white transition-colors">Jobing Pages</Link>
              <Link href="/copy" className="hover:text-white transition-colors">Jobing Notepad</Link>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-[#222] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
            <p>&copy; {new Date().getFullYear()} Jobing AI. All rights reserved.</p>
            <div className="flex items-center gap-1">
              Built with <Heart size={14} className="text-red-500 mx-1" /> for builders.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple Heart Icon fallback if not in lucide imports
function Heart(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
