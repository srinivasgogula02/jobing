import { AuthButton } from "@/components/AuthButton";
import Image from "next/image";
import {
  ArrowRight,
  FileText,
  ClipboardPaste,
  Download,
  Shield,
  ChevronDown,
  Target,
  Users,
  Star,
  Zap,
  Globe,
  Code,
} from "lucide-react";
import Link from "next/link";
import { CopyPasteAnimation } from "@/components/CopyPasteAnimation";
import { HeroShowcase } from "@/components/HeroShowcase";
import { Pricing } from "@/components/Pricing";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

const COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "TCS", domain: "tcs.com" },
  { name: "Infosys", domain: "infosys.com" },
  { name: "Razorpay", domain: "razorpay.com" },
  { name: "Accenture", domain: "accenture.com" },
  { name: "Zomato", domain: "zomato.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "IBM", domain: "ibm.com" },
];

const FAQS = [
  {
    q: "How does Jobing AI tailor my resume?",
    a: "You add your experience once — upload an existing resume or chat with the AI. Then for every job, paste the job description and Jobing rewrites your resume to emphasize the skills and keywords that role asks for. The result is a clean, ATS-friendly PDF ready to download in under a minute.",
  },
  {
    q: "Will it invent experience I don't have?",
    a: "No. Jobing reorders, rephrases, and emphasizes your real experience to match the role — it never fabricates jobs, skills, or qualifications. What goes on the resume is yours; it's just framed the way recruiters scan for.",
  },
  {
    q: "What is an ATS, and why should I care?",
    a: "An Applicant Tracking System is the software most companies use to filter resumes before a human reads them. If your resume doesn't use the language of the job description, it can be rejected automatically. Jobing matches that language for every application, so your resume gets seen.",
  },
  {
    q: "Is Jobing free?",
    a: "The tools are free forever, no login needed: the online notepad at /copy, shareable notes, and Jobing Pages. The AI resume builder is a paid product — Pro starts at ₹249/month for 50 tailored resumes.",
  },
  {
    q: "Do the free tools require an account?",
    a: "No. Open jobing.site/copy, start typing, and share with a link. Notes sync across devices instantly — no sign-up, no install.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Subscriptions are month-to-month and you can cancel from your billing page in one click. No lock-in, no cancellation fees.",
  },
];

export default async function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-[#C1FF00] selection:text-black">

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
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "499",
              "priceCurrency": "INR",
            },
            "description": "Paste any job description and get an ATS-friendly resume tailored to it in seconds. Plus free tools: an online notepad, instant text sharing, and one-link portfolio pages.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          }),
        }}
      />

      {/* ─────── Nav ─────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
          <Link href="/" className="text-lg font-extrabold text-[#1a1a1a] tracking-tight flex items-center gap-2">
            <div className="rounded-md overflow-hidden">
              <Image
                src="/logo.png"
                alt="Jobing AI"
                width={52}
                height={20}
                className="object-contain h-6 w-auto"
                priority
              />
            </div>
            Jobing AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <a href="#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</a>
            <a href="#free-tools" className="hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5">
              Free Tools <span className="bg-[#C1FF00] text-[#1a1a1a] text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider leading-none font-bold">Free</span>
            </a>
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <AuthButton mode="sign-in" className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors hidden sm:block">
              Login
            </AuthButton>
            <AuthButton mode="sign-up" className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2">
              Build My Resume
            </AuthButton>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-24 px-5 md:px-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          {/* Left: copy */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] shadow-sm mb-6">
              <span className="text-[13px] font-medium text-[#6b7280]">
                Used by <strong className="text-[#1a1a1a]">11,000+</strong> job seekers and students
              </span>
            </div>

            <h1 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] font-black tracking-tight leading-[1.18] text-[#1a1a1a] mb-6">
              The only subscription you need in the age of AI{" "}
              <span className="bg-[#C1FF00] px-2.5 py-1 rounded box-decoration-clone">
                to get hired.
              </span>
            </h1>

            {/* Playful "pick one" toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f5f5f4] border border-[#e5e5e5] mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a1a] text-white text-[13px] font-bold">
                <Check size={14} className="text-[#C1FF00]" /> Get hired
              </span>
              <span className="px-3 py-1.5 text-[13px] font-bold text-[#b0b0b0] line-through decoration-2">
                Stay unemployed
              </span>
            </div>

            <p className="text-base md:text-lg text-[#6b7280] max-w-md lg:max-w-lg mb-8 leading-relaxed font-medium">
              Paste any job description and get a resume tailored to beat the{" "}
              <strong className="text-[#1a1a1a]">ATS filters</strong> — in under a minute.
              You bring the experience, the AI brings the wording.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <AuthButton mode="sign-up" className="btn-primary flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold rounded-xl shadow-lg shadow-[#C1FF00]/25 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto">
                Tailor My Resume <ArrowRight size={18} />
              </AuthButton>
              <a href="#demo" className="btn-secondary px-7 py-3.5 text-base font-bold rounded-xl w-full sm:w-auto">
                See It in Action
              </a>
            </div>
            <p className="mt-5 text-sm text-[#9ca3af] font-medium">
              No credit card to sign up · Free tools need no login at all
            </p>
          </div>

          {/* Right: product showcase */}
          <div className="w-full">
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* ─────── Live Demo (show, don't tell) ─────── */}
      <div id="demo" className="scroll-mt-20">
        <CopyPasteAnimation />
      </div>

      {/* ─────── Company Marquee (Social Proof) ─────── */}
      <section className="py-8 md:py-10 bg-white overflow-hidden relative border-b border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto px-5 mb-5 text-center">
          <p className="text-[13px] font-bold text-[#9ca3af] uppercase tracking-widest">
            Resumes tailored every day for roles at
          </p>
        </div>

        <div className="relative flex overflow-x-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>

          {[false, true].map((isDuplicate) => (
            <div
              key={isDuplicate ? "dup" : "main"}
              className="flex animate-marquee items-center min-w-max py-2"
              aria-hidden={isDuplicate || undefined}
            >
              {COMPANIES.map((company) => (
                <div
                  key={company.name}
                  className="mx-6 md:mx-10 flex items-center gap-2 md:gap-3 opacity-50 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 select-none"
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
          ))}
        </div>
      </section>

      {/* ─────── How It Works ─────── */}
      <section id="how-it-works" className="py-16 md:py-24 px-5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              One profile. <br className="md:hidden" />
              <span className="bg-[#C1FF00] px-2 py-0.5 rounded">A resume for every job.</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto font-medium">
              Set up once, then tailor in seconds. No more rewriting the same resume
              every time a new opening shows up.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#e5e5e5] to-transparent z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative z-10">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Add your experience once",
                  desc: "Upload your current resume or chat with the AI. It builds your master profile — education, projects, work, skills.",
                },
                {
                  step: "02",
                  icon: ClipboardPaste,
                  title: "Paste any job description",
                  desc: "From LinkedIn, Naukri, or a campus placement notice. The AI reads what the role really asks for.",
                },
                {
                  step: "03",
                  icon: Download,
                  title: "Download the tailored resume",
                  desc: "An ATS-ready PDF with your real experience reframed for that exact role — in under a minute.",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-[#e5e5e5] flex flex-col items-center justify-center mb-6 relative group-hover:border-[#C1FF00] group-hover:shadow-[0_0_20px_rgba(193,255,0,0.2)] transition-all">
                    <span className="absolute -top-3 bg-white border border-[#e5e5e5] text-[#6b7280] text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:text-[#1a1a1a] group-hover:border-[#C1FF00] group-hover:bg-[#C1FF00] transition-colors">
                      {item.step}
                    </span>
                    <item.icon size={28} className="text-[#6b7280] group-hover:text-[#1a1a1a] transition-colors mb-1" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed max-w-[280px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 md:mt-24">
            {[
              {
                icon: Target,
                title: "Beats the keyword filters",
                desc: "Most resumes are rejected by ATS software before a human reads them. Jobing mirrors the job description's language so yours gets through.",
              },
              {
                icon: Shield,
                title: "Never invents experience",
                desc: "It reorders, rephrases, and emphasizes what you've actually done. Nothing on the page is made up — it's your story, told for this role.",
              },
              {
                icon: Zap,
                title: "Seconds, not evenings",
                desc: "Tailoring a resume by hand takes hours per application. Jobing does it in under a minute, so you can apply to more roles, better.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-7 group hover:border-[#C1FF00] transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center mb-5 transition-colors">
                  <item.icon size={22} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Stats ─────── */}
      <section className="py-16 md:py-20 px-5 bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { value: "11,000+", label: "Users worldwide", icon: Users },
              { value: "<1 min", label: "From job description to resume", icon: Zap },
              { value: "50", label: "Tailored resumes a month on Pro", icon: FileText },
              { value: "0", label: "Logins needed for the free tools", icon: Globe },
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

      {/* ─────── Free Tools ─────── */}
      <section id="free-tools" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0] scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Free tools. No login. <span className="bg-[#C1FF00] px-2 py-0.5 rounded">Forever.</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto font-medium">
              The tools thousands of students and developers use every day to share
              notes, code, and portfolios — completely free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/copy" className="card block p-8 group hover:border-[#C1FF00] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center mb-6 transition-colors">
                <Code size={24} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Jobing Notepad</h3>
              <p className="text-[#6b7280] leading-relaxed mb-6">
                Type or paste anything, get a short link, open it on any device. The fastest
                way to move code, lab programs, and notes between the lab PC and your phone —
                no login, ever.
              </p>
              <div className="flex items-center text-[#1a1a1a] font-bold text-sm">
                Start Typing <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            <Link href="/pages" className="card block p-8 group hover:border-[#C1FF00] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center mb-6 transition-colors">
                <Globe size={24} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Jobing Pages</h3>
              <p className="text-[#6b7280] leading-relaxed mb-6">
                Host your portfolio, resume, or links instantly with a custom short URL.
                Zero setup, zero hosting fees. Live in 5 seconds.
              </p>
              <div className="flex items-center text-[#1a1a1a] font-bold text-sm">
                Create a Page <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>

          <p className="text-center text-sm text-[#9ca3af] mt-8 font-medium">
            Also see:{" "}
            <Link href="/online-notepad" className="underline hover:text-[#1a1a1a] transition-colors">Online Notepad</Link>
            {" · "}
            <Link href="/online-clipboard" className="underline hover:text-[#1a1a1a] transition-colors">Online Clipboard</Link>
            {" · "}
            <Link href="/share-text" className="underline hover:text-[#1a1a1a] transition-colors">Share Text Online</Link>
          </p>
        </div>
      </section>

      {/* ─────── Testimonials ─────── */}
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
                quote: "I used to lose a whole evening rewriting my resume for every application. Now I paste the job description and have a tailored version before my chai gets cold.",
                name: "Priya S.",
                role: "Frontend Developer, Hyderabad",
                stars: 5,
              },
              {
                quote: "The keyword matching is the real deal. Same experience, reworded for each role — my shortlist rate went up within two weeks of switching.",
                name: "Rahul M.",
                role: "Data Analyst, Bengaluru",
                stars: 5,
              },
              {
                quote: "Found Jobing through the notepad my whole class uses to share lab programs. The resume builder ended up getting me through campus placements.",
                name: "Ananya K.",
                role: "CS Final Year, Vijayawada",
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

      {/* ─────── Price Anchoring & Pricing ─────── */}
      <section id="pricing" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0] scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Every application, tailored. <br className="md:hidden" />
              <span className="bg-[#C1FF00] px-2 py-0.5 rounded">Less than your Netflix.</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto font-medium">
              50 tailored resumes a month for less than everyday things you already spend on.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto mb-8">
            {[
              { emoji: "☕", label: "2 chai lattes", sub: "at any café" },
              { emoji: "🍗", label: "A single biryani", sub: "from Swiggy" },
              { emoji: "📱", label: "Mobile recharge", sub: "monthly plan" },
              { emoji: "🎬", label: "One movie ticket", sub: "weekend show" },
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

      {/* ─────── FAQ ─────── */}
      <section id="faq" className="py-16 md:py-24 px-5 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[#6b7280] text-lg font-medium">
              Everything you need to know before you start.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="card group px-6 py-1">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-bold text-[#1a1a1a] text-[15px] md:text-base">
                  {faq.q}
                  <ChevronDown size={18} className="text-[#9ca3af] shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-[#6b7280] text-sm md:text-[15px] leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="py-20 md:py-28 px-5 bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C1FF00]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Your next application<br />
            deserves a better resume.
          </h2>
          <p className="text-[#9ca3af] text-lg md:text-xl mb-10 max-w-lg mx-auto font-medium">
            Join 11,000+ job seekers who stopped rewriting and started getting shortlisted.
          </p>
          <AuthButton mode="sign-up" className="btn-primary flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold shadow-[0_0_30px_rgba(193,255,0,0.2)] hover:shadow-[0_0_50px_rgba(193,255,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all mx-auto">
            Tailor My Resume <ArrowRight size={20} />
          </AuthButton>
          <p className="mt-6 text-sm text-[#6b7280]">Instant access · Cancel anytime</p>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="py-12 px-5 border-t border-[#f0f0f0] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="rounded-md overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Jobing AI"
                    width={52}
                    height={20}
                    className="object-contain h-5 w-auto"
                  />
                </div>
                <span className="font-extrabold text-[#1a1a1a] text-lg">Jobing AI</span>
              </Link>
              <p className="text-sm text-[#9ca3af] leading-relaxed max-w-[220px]">
                A tailored resume for every job, and free tools for everything in between.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Product</p>
              <div className="flex flex-col gap-3 text-sm font-medium text-[#6b7280]">
                <a href="#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</a>
                <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
                <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
                <Link href="/blog" className="hover:text-[#1a1a1a] transition-colors">Blog</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Free Tools</p>
              <div className="flex flex-col gap-3 text-sm font-medium text-[#6b7280]">
                <Link href="/copy" className="hover:text-[#1a1a1a] transition-colors">Jobing Notepad</Link>
                <Link href="/pages" className="hover:text-[#1a1a1a] transition-colors">Jobing Pages</Link>
                <Link href="/online-notepad" className="hover:text-[#1a1a1a] transition-colors">Online Notepad</Link>
                <Link href="/online-clipboard" className="hover:text-[#1a1a1a] transition-colors">Online Clipboard</Link>
                <Link href="/share-text" className="hover:text-[#1a1a1a] transition-colors">Share Text</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Company</p>
              <div className="flex flex-col gap-3 text-sm font-medium text-[#6b7280]">
                <Link href="/about" className="hover:text-[#1a1a1a] transition-colors">About</Link>
                <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">Privacy</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#f0f0f0] text-center text-sm text-[#9ca3af]">
            &copy; {new Date().getFullYear()} Jobing AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
