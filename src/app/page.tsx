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
} from "lucide-react";
import Link from "next/link";
import { CopyPasteAnimation } from "@/components/CopyPasteAnimation";
import { Pricing } from "@/components/Pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/create");
  }

  return (
    <div className="min-h-screen bg-white">
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
            "description": "Instantly tailor your experience to any job description and bypass the ATS algorithms in seconds."
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Jobing AI tailor my resume?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "When you paste a job description, our AI analyzes the required skills, keywords, and responsibilities. It then rewrites your profile data — experience, skills, and summary — to perfectly match what the employer is looking for. It's not just rearranging; it's rewriting."
                }
              },
              {
                "@type": "Question",
                "name": "Do I need to fill my profile every time?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No! You build your profile once through a simple chat conversation. After that, every resume is generated automatically from your saved profile — just paste a new job description each time."
                }
              },
              {
                "@type": "Question",
                "name": "What format is the resume in?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Your resume is generated as a professional PDF — using the same premium typesetting trusted by top-tier tech companies. It looks clean, polished, and passes ATS systems."
                }
              },
              {
                "@type": "Question",
                "name": "Is the free plan enough to get started?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You get 2 free resume credits when you sign up. If you need more, the Pro plan at ₹249/month gives you 50 resumes — less than the cost of a single biryani."
                }
              },
              {
                "@type": "Question",
                "name": "Can I cancel my subscription anytime?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. You can cancel anytime with one click. No questions asked, no hidden fees. We also offer a 7-day money-back guarantee."
                }
              },
              {
                "@type": "Question",
                "name": "Is my data safe?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "100%. Your profile is encrypted and stored securely. We never sell, share, or use your personal data for anything other than generating your resumes."
                }
              }
            ]
          })
        }}
      />

      {/* ─────── Nav ─────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-5 md:px-10 py-4">
          <Link href="/" className="text-lg font-extrabold text-[#1a1a1a] tracking-tight">
            Jobing AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <a href="#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</a>
            <a href="#use-cases" className="hover:text-[#1a1a1a] transition-colors">Use Cases</a>
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <SignInButton>
              <button className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors hidden sm:block">
                Login
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="btn-primary px-5 py-2.5 text-sm font-bold">
                Get Started Free
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

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C1FF00]/15 border border-[#C1FF00]/30 text-[13px] font-bold text-[#1a1a1a] mb-8">
            <Sparkles size={14} />
            Get Shortlisted Faster
          </div>

          <h1 className="text-[1.75rem] sm:text-4xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.15] lg:leading-[1.1] text-[#1a1a1a] mb-5 lg:mb-6 lg:px-0">
            Tired of getting rejected
            <br className="block md:hidden" />
            <br className="hidden md:block" />
            <span className="relative inline-block mt-0 lg:mt-2">
              <span className="relative z-10 lg:ml-2">with the same resume?</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3 lg:h-4 bg-[#C1FF00]/40 -z-0 rounded-sm" />
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#6b7280] max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Stop sending the same generic resume everywhere.{" "}
            <strong className="text-[#1a1a1a]">Paste a job description</strong>,{" "}
            and our AI completely rewrites your experience to beat the ATS and get you hired in{" "}
            <strong className="text-[#1a1a1a]">under 30 seconds</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <SignUpButton>
              <button className="btn-primary px-8 py-4 text-[15px] font-bold gap-2.5 shadow-lg shadow-[#C1FF00]/25 hover:scale-[1.02] transition-transform w-full sm:w-auto">
                Start Building — It&apos;s Free
                <ArrowRight size={18} />
              </button>
            </SignUpButton>
            <a href="#how-it-works" className="btn-secondary px-7 py-3.5 text-sm font-semibold w-full sm:w-auto">
              See How It Works
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#9ca3af] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#8bb800]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#8bb800]" />
              2 free resumes included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#8bb800]" />
              ATS-optimized output
            </span>
          </div>
        </div>
      </section>

      {/* ─────── Company Marquee (Social Proof) ─────── */}
      <section className="py-8 md:py-10 border-t border-[#f0f0f0] bg-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-5 mb-5 text-center">
          <p className="text-[13px] font-bold text-[#9ca3af] uppercase tracking-widest">
            Our users have landed jobs at 
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
      {/* ─────── Stats Bar ─────── */}
      <section className="py-12 md:py-16 px-5 bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { value: "2,400+", label: "Resumes Generated", icon: FileText },
              { value: "87%", label: "Got Interview Callbacks", icon: BarChart3 },
              { value: "350+", label: "Jobs & Internships Landed", icon: Target },
              { value: "4.9★", label: "Average User Rating", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-[#C1FF00]/15 flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={18} className="text-[#C1FF00]" />
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-[#9ca3af] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Copy and Paste Animation ─────── */}
      <CopyPasteAnimation />

      {/* ─────── Price Anchoring ─────── */}
      <section className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Less Than You <span className="bg-[#C1FF00] px-2 py-0.5 rounded">Think</span>
            </h2>
            <p className="text-[#6b7280] text-base md:text-lg max-w-lg mx-auto font-medium">
              50 tailored resumes a month. Less than everyday things you already spend on.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto mb-10">
            {[
              { emoji: "☕", label: "2 chai lattes", sub: "at any café" },
              { emoji: "🍗", label: "A single biryani", sub: "from Swiggy" },
              { emoji: "📱", label: "Your mobile recharge", sub: "monthly plan" },
              { emoji: "💼", label: "1 day of LinkedIn Premium", sub: "seriously." },
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

          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-2 px-8 py-5 bg-white rounded-2xl border border-[#C1FF00] shadow-sm shadow-[#C1FF00]/10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-extrabold text-[#1a1a1a]">₹249</span>
                <span className="text-[#6b7280] font-semibold">/month</span>
              </div>
              <p className="text-sm text-[#6b7280] font-medium">50 tailored resumes. Your career is worth it. 🚀</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── How It Works ─────── */}
      <section id="how-it-works" className="py-16 md:py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Three Steps. Under 60 Seconds.
            </h2>
            <p className="text-[#6b7280] text-base max-w-md mx-auto font-medium">
              From job posting to polished PDF — faster than making instant noodles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                step: "01",
                icon: Brain,
                title: "Build Your Profile",
                desc: "Chat with our AI assistant to add your education, experience, skills, and projects. Do it once — use it forever.",
                highlight: "Do it once",
              },
              {
                step: "02",
                icon: ClipboardPaste,
                title: "Paste Any Job Description",
                desc: "Found a job on LinkedIn, Naukri, or Indeed? Copy the job posting and paste it in. That's all you need to do.",
                highlight: "That's all",
              },
              {
                step: "03",
                icon: Download,
                title: "Download Your Resume",
                desc: "Our AI rewrites your experience, skills, and summary to perfectly match the job. Download a stunning PDF.",
                highlight: "perfectly match",
              },
            ].map((item) => (
              <div key={item.step} className="card p-6 md:p-7 group hover:border-[#C1FF00] transition-all">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[#C1FF00]/20 flex items-center justify-center group-hover:bg-[#C1FF00]/30 transition-colors">
                    <item.icon size={20} className="text-[#1a1a1a]" />
                  </div>
                  <span className="text-[11px] font-extrabold text-[#C1FF00] bg-[#1a1a1a] px-3 py-1 rounded-full tracking-[0.15em]">
                    STEP {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Use Cases ─────── */}
      <section id="use-cases" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              USE CASES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              When Should You Use Jobing?
            </h2>
            <p className="text-[#6b7280] text-base max-w-lg mx-auto font-medium">
              Anytime you need a resume that actually gets you shortlisted.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              {
                emoji: "🎓",
                title: "Campus Placements",
                desc: "Mass-apply to dream companies with a resume tailored for each one. Stand out from 500+ applicants.",
              },
              {
                emoji: "💼",
                title: "Off-Campus Applications",
                desc: "Apply on LinkedIn, Naukri, Indeed, or Glassdoor with a resume that matches the exact job requirements.",
              },
              {
                emoji: "🏢",
                title: "Internship Season",
                desc: "Whether it's summer internships or winter projects, customize your resume for every opportunity.",
              },
              {
                emoji: "🔄",
                title: "Career Switches",
                desc: "Switching from one industry to another? Our AI reframes your experience to fit your target role.",
              },
              {
                emoji: "📩",
                title: "Referral Applications",
                desc: "Make the referrer's job easy. Send a resume that's already tailored — they'll thank you for it.",
              },
              {
                emoji: "🌍",
                title: "International Applications",
                desc: "Applying abroad? Get a resume formatted to global standards with the right keywords and phrasing.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-6 group hover:border-[#C1FF00] transition-all">
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Features ─────── */}
      <section className="py-16 md:py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Why <span className="bg-[#C1FF00] px-2 py-0.5 rounded">2,400+</span> People Chose Jobing
            </h2>
            <p className="text-[#6b7280] text-base max-w-md mx-auto font-medium">
              Everything you need to stand out. Nothing you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              {
                icon: Sparkles,
                title: "AI-Tailored Content",
                desc: "Every resume is uniquely rewritten to match the specific job description — not just rearranged, rewritten.",
              },
              {
                icon: FileText,
                title: "Premium Typography",
                desc: "Professional-grade typesetting that makes your resume look polished, academic, and ATS-friendly.",
              },
              {
                icon: Zap,
                title: "30-Second Generation",
                desc: "From paste to PDF in under 30 seconds. No formatting, no templates, no hours wasted.",
              },
              {
                icon: Download,
                title: "One-Click Download",
                desc: "Preview your resume in-browser and download the print-ready PDF instantly.",
              },
              {
                icon: Target,
                title: "ATS-Optimized",
                desc: "Keywords, format, and structure — all optimized to pass Applicant Tracking Systems.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Your data stays yours. We don't sell or share your information with anyone. Ever.",
              },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 flex gap-4 items-start group hover:border-[#C1FF00] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f4] group-hover:bg-[#C1FF00]/20 flex items-center justify-center shrink-0 transition-colors">
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

      {/* ─────── Pricing ─────── */}
      <section id="pricing" className="bg-[#fafafa] border-y border-[#f0f0f0]">
        <Pricing />
      </section>

      {/* ─────── Social Proof ─────── */}
      <section className="py-16 md:py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Real People. Real Results.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "I applied to 12 companies during campus season with Jobing resumes. Got shortlisted in 8. Placed at my dream company.",
                name: "Priya S.",
                role: "SDE @ Amazon",
                stars: 5,
              },
              {
                quote: "Was sending the same resume everywhere and getting no calls. Jobing changed that — got 3 interview calls in the first week.",
                name: "Rahul M.",
                role: "Frontend Dev @ Razorpay",
                stars: 5,
              },
              {
                quote: "Less than ₹250 per month for resumes that actually work? Absolute no-brainer for any serious job seeker.",
                name: "Ananya K.",
                role: "Data Analyst Intern @ Flipkart",
                stars: 5,
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-[#C1FF00] fill-[#C1FF00]" />
                  ))}
                </div>
                <p className="text-sm text-[#1a1a1a] leading-relaxed mb-5 font-medium">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">{testimonial.name}</p>
                  <p className="text-xs text-[#9ca3af]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── FAQ ─────── */}
      <section id="faq" className="py-16 md:py-24 px-5 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-[12px] font-bold tracking-widest uppercase bg-[#f5f5f4] text-[#6b7280] rounded-full border border-[#e5e5e5]">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does Jobing AI tailor my resume?",
                a: "When you paste a job description, our AI analyzes the required skills, keywords, and responsibilities. It then rewrites your profile data — experience, skills, and summary — to perfectly match what the employer is looking for. It's not just rearranging; it's rewriting.",
              },
              {
                q: "Do I need to fill my profile every time?",
                a: "No! You build your profile once through a simple chat conversation. After that, every resume is generated automatically from your saved profile — just paste a new job description each time.",
              },
              {
                q: "What format is the resume in?",
                a: "Your resume is generated as a professional PDF — using the same premium typesetting trusted by top-tier tech companies. It looks clean, polished, and passes ATS systems.",
              },
              {
                q: "Is the free plan enough to get started?",
                a: "Yes! You get 2 free resume credits when you sign up. If you need more, the Pro plan at ₹249/month gives you 50 resumes — less than the cost of a single biryani.",
              },
              {
                q: "Can I cancel my subscription anytime?",
                a: "Absolutely. You can cancel anytime with one click. No questions asked, no hidden fees. We also offer a 7-day money-back guarantee.",
              },
              {
                q: "Is my data safe?",
                a: "100%. Your profile is encrypted and stored securely. We never sell, share, or use your personal data for anything other than generating your resumes.",
              },
            ].map((item) => (
              <details key={item.q} className="group card overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 md:p-6 text-[15px] font-bold text-[#1a1a1a] list-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    size={18}
                    className="text-[#9ca3af] shrink-0 ml-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-[#6b7280] leading-relaxed -mt-1">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="py-20 md:py-28 px-5 bg-[#1a1a1a] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C1FF00]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-white mb-5 tracking-tight leading-tight">
            Your Next Job Is One
            <br />
            Resume Away
          </h2>
          <p className="text-[#9ca3af] text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed font-medium">
            Join 2,400+ students and professionals who stopped guessing and started getting callbacks.
          </p>
          <SignUpButton>
            <button className="btn-primary px-10 py-4 text-[15px] font-bold gap-2.5 shadow-lg shadow-[#C1FF00]/30 hover:scale-[1.02] transition-transform">
              Get Started — It&apos;s Free
              <ArrowRight size={18} />
            </button>
          </SignUpButton>
          <p className="mt-6 text-sm text-[#6b7280]">No credit card needed · 2 free resumes · Cancel anytime</p>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="py-10 px-5 border-t border-[#f0f0f0] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1a1a1a] text-base">Jobing AI</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#6b7280]">
              <a href="#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</a>
              <a href="#use-cases" className="hover:text-[#1a1a1a] transition-colors">Use Cases</a>
              <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
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
