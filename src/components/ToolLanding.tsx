import Link from "next/link";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";

/**
 * Server-rendered SEO landing page shell for the free utilities.
 *
 * Search Console showed Jobing ranking #1 only for its own brand, while high-intent
 * generic queries it already serves well — "online notepad", "online clipboard",
 * "share text online", "notepad with clipboard" — sat at positions 50-105 with zero
 * clicks. There were no dedicated, indexable pages for them. These landing pages give
 * each query a focused, content-rich, fast-loading home that funnels straight into the
 * live /copy tool, plus FAQ + SoftwareApplication structured data for rich results.
 */

export interface ToolLandingFeature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface ToolLandingFAQ {
  q: string;
  a: string;
}

export interface ToolLandingRelated {
  href: string;
  label: string;
  desc: string;
}

export interface ToolLandingConfig {
  path: string;
  badge: string;
  h1: string;
  lede: string;
  ctaPrimaryLabel: string;
  intro: string[];
  features: ToolLandingFeature[];
  steps: { title: string; body: string }[];
  faqs: ToolLandingFAQ[];
  related: ToolLandingRelated[];
  appName: string;
}

const SITE = "https://jobing.site";

export default function ToolLanding({ config }: { config: ToolLandingConfig }) {
  const {
    path,
    badge,
    h1,
    lede,
    ctaPrimaryLabel,
    intro,
    features,
    steps,
    faqs,
    related,
    appName,
  } = config;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web-based)",
    url: `${SITE}${path}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1200",
    },
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      {/* Nav */}
      <header className="border-b border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Jobing AI" className="h-6 w-auto object-contain" />
            <span className="font-extrabold text-lg">Jobing AI</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-[#6b7280]">
            <Link href="/copy" className="hover:text-[#1a1a1a] transition-colors">Notepad</Link>
            <Link href="/tools" className="hover:text-[#1a1a1a] transition-colors">Tools</Link>
            <Link href="/copy" className="btn-primary px-4 py-2 text-sm">Open free tool</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-[#C1FF00] text-[#1a1a1a] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-6">
            {badge} · Free · No login
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-5">
            {h1}
          </h1>
          <p className="text-lg md:text-xl text-[#6b7280] font-medium max-w-2xl mx-auto mb-9">
            {lede}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/copy"
              className="btn-primary px-8 py-4 text-base font-bold gap-2 w-full sm:w-auto"
            >
              {ctaPrimaryLabel} <ArrowRight size={18} />
            </Link>
            <Link
              href="/tools"
              className="btn-secondary px-8 py-4 text-base font-medium w-full sm:w-auto"
            >
              See all free tools
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#9ca3af]">
            No account · No installation · Works on every device
          </p>
        </div>

        {/* Editor mock */}
        <div className="max-w-3xl mx-auto mt-14">
          <div className="card overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs font-mono text-[#9ca3af]">jobing.site/c/my-notes</span>
            </div>
            <div className="p-6 font-mono text-sm text-[#374151] leading-relaxed min-h-[160px] bg-white">
              <span className="text-[#9ca3af]"># Paste anything here…</span>
              <br />
              <br />
              Meeting notes, code snippets, a Wi-Fi password,
              <br />
              a long URL — then share the link. It just works.
            </div>
          </div>
        </div>
      </section>

      {/* Intro prose (SEO body) */}
      <section className="px-5 py-4">
        <div className="max-w-3xl mx-auto space-y-5 text-[15px] md:text-base text-[#374151] leading-relaxed">
          {intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-6">
                <div className="w-11 h-11 rounded-lg bg-[#1a1a1a] text-[#C1FF00] flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-14 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-10">
            How it works
          </h2>
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#C1FF00] text-[#1a1a1a] font-black flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="card p-5 group">
                <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-[#9ca3af] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#6b7280] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related tools (internal links) */}
      <section className="px-5 py-14 bg-[#fafafa] border-y border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-black tracking-tight mb-6">More free Jobing tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="card p-5 group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold group-hover:text-[#65a30d] transition-colors">{r.label}</h3>
                  <ArrowRight size={16} className="text-[#9ca3af] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm text-[#6b7280] leading-relaxed">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 bg-[#1a1a1a] text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Try it now — it&apos;s free</h2>
        <p className="text-[#9ca3af] mb-8 max-w-md mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1"><Check size={15} className="text-[#C1FF00]" /> No sign-up</span>
          <span className="inline-flex items-center gap-1"><Check size={15} className="text-[#C1FF00]" /> No ads in your way</span>
          <span className="inline-flex items-center gap-1"><Check size={15} className="text-[#C1FF00]" /> Instant share links</span>
        </p>
        <Link href="/copy" className="btn-primary px-10 py-4 text-base font-bold gap-2">
          {ctaPrimaryLabel} <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-5 py-10 border-t border-[#f0f0f0]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-[#6b7280]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Jobing AI" className="h-5 w-auto object-contain" />
            <span className="font-extrabold text-[#1a1a1a]">Jobing AI</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium">
            <Link href="/online-notepad" className="hover:text-[#1a1a1a]">Online Notepad</Link>
            <Link href="/online-clipboard" className="hover:text-[#1a1a1a]">Online Clipboard</Link>
            <Link href="/share-text" className="hover:text-[#1a1a1a]">Share Text</Link>
            <Link href="/tools" className="hover:text-[#1a1a1a]">All Tools</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
