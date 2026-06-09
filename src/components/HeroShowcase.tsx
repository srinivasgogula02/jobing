"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

const SKILLS = [
  { label: "React", matched: true },
  { label: "TypeScript", matched: true },
  { label: "Next.js", matched: true },
  { label: "System Design", matched: false },
  { label: "GraphQL", matched: true },
];

/**
 * Animated hero showcase: a realistic résumé being tailored in real time.
 *
 * An AI "scan" sweeps the document, matched keywords light up in lime, a
 * match-score ring draws and counts up to 94%, and floating accent cards
 * (the score gauge + a "keywords matched" toast) give the composition depth.
 * Everything settles into a stable resting state; only the scan + gentle
 * float keep looping. Respects prefers-reduced-motion via globals.css.
 */
export function HeroShowcase() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setScore(94);
      return;
    }

    let raf = 0;
    const target = 94;
    const duration = 1700;
    const start = performance.now() + 200; // sync with ring's 0.2s delay
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setScore(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-md flex justify-center py-8">
      {/* Soft lime glow */}
      <div className="absolute inset-8 bg-[#C1FF00]/25 rounded-[3rem] blur-3xl pointer-events-none" />

      {/* ── Résumé document ── */}
      <div className="relative z-10 w-[300px] sm:w-[330px] bg-white rounded-[1.5rem] border border-[#ececec] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.4)] px-6 py-7 overflow-hidden">
        {/* AI scan sweep */}
        <div className="absolute inset-0 hero-scan-overlay pointer-events-none z-20" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#404040] flex items-center justify-center text-white font-black text-lg shrink-0">
            A
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-black text-[#1a1a1a] leading-tight">Aarav Sharma</p>
            <p className="text-[11px] font-semibold text-[#9ca3af] leading-tight">Senior Frontend Engineer</p>
          </div>
        </div>

        <div className="h-px bg-[#f0f0f0] mb-4" />

        {/* Experience */}
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#b0b0b0] mb-2.5">
          Experience
        </p>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-bold text-[#1a1a1a]">Stripe · Frontend Engineer</p>
          <p className="text-[10px] font-semibold text-[#b0b0b0]">2021 — Now</p>
        </div>
        <ul className="space-y-2 mb-5">
          <li className="flex gap-2 text-[11px] leading-snug text-[#4b5563]">
            <span className="text-[#C1FF00] font-black mt-px">›</span>
            <span>
              Shipped{" "}
              <span className="hero-highlight font-semibold text-[#1a1a1a]" style={{ animationDelay: "0.7s" }}>
                React
              </span>{" "}
              dashboards used by 2M+ customers
            </span>
          </li>
          <li className="flex gap-2 text-[11px] leading-snug text-[#4b5563]">
            <span className="text-[#C1FF00] font-black mt-px">›</span>
            <span>
              Led the{" "}
              <span className="hero-highlight font-semibold text-[#1a1a1a]" style={{ animationDelay: "1.05s" }}>
                TypeScript
              </span>{" "}
              migration across 40+ services
            </span>
          </li>
          <li className="flex gap-2 text-[11px] leading-snug text-[#4b5563]">
            <span className="text-[#C1FF00] font-black mt-px">›</span>
            <span>
              Cut page load time 38% with{" "}
              <span className="hero-highlight font-semibold text-[#1a1a1a]" style={{ animationDelay: "1.4s" }}>
                code-splitting
              </span>
            </span>
          </li>
        </ul>

        {/* Skills */}
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#b0b0b0] mb-2.5">
          Skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((skill, i) => (
            <span
              key={skill.label}
              className={`animate-hero-pop inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                skill.matched
                  ? "bg-[#C1FF00] border-[#C1FF00] text-[#1a1a1a]"
                  : "bg-white border-[#e5e5e5] text-[#9ca3af]"
              }`}
              style={{ animationDelay: `${1.6 + i * 0.12}s` }}
            >
              {skill.matched && <Check size={10} strokeWidth={3.5} />}
              {skill.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Floating: match-score gauge (top-right) ── */}
      <div className="absolute z-30 top-2 right-0 sm:-right-2 w-[112px] bg-white rounded-2xl border border-[#ececec] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)] p-3 animate-hero-float">
        <div className="relative w-[74px] h-[74px] mx-auto">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#f2f2f2" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#C1FF00"
              strokeWidth="8"
              strokeLinecap="round"
              className="hero-ring-draw"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[22px] font-black text-[#1a1a1a] leading-none tabular-nums">
              {score}
              <span className="text-[#b0b0b0] text-[14px]">%</span>
            </span>
          </div>
        </div>
        <p className="text-center text-[10px] font-bold text-[#6b7280] mt-1.5">ATS match</p>
      </div>

      {/* ── Floating: keywords-matched toast (bottom-left) ── */}
      <div className="absolute z-30 bottom-6 left-0 sm:-left-3 bg-white rounded-2xl border border-[#ececec] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)] px-3.5 py-2.5 flex items-center gap-2.5 animate-hero-float-slow">
        <div className="w-8 h-8 rounded-full bg-[#C1FF00]/25 flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-[#1a1a1a]" />
        </div>
        <div>
          <p className="text-[11px] font-black text-[#1a1a1a] leading-tight">12 keywords matched</p>
          <p className="text-[9.5px] text-[#9ca3af] leading-tight">from the job description</p>
        </div>
      </div>
    </div>
  );
}
