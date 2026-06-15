"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { captureLead } from "@/app/actions/readiness";
import type { ScoreResult } from "@/lib/readiness-score";
import s from "../../readiness.module.css";

const RING_CIRC = 2 * Math.PI * 78; // r=78 in the 184px ring

export default function ResultClient({
  publicResultId,
  result,
}: {
  publicResultId: string;
  result: ScoreResult;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<"reveal" | "done">("reveal");

  // The capture token is the owner secret handed over by the assessment page.
  // Present → this is the owner, show the capture form. Absent → a visitor who
  // opened a shared link; show a "check your own score" CTA instead.
  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(`readiness.token.${publicResultId}`));
    } catch {
      setToken(null);
    }
  }, [publicResultId]);

  const display = useCountUp(result.score);

  if (phase === "done") {
    return (
      <main className={s.root}>
        <div className={s.shell}>
          <div className={s.stateWrap}>
            <div className={`${s.stateIcon} ${s.ok}`}>✓</div>
            <div className={s.stateT}>Plan sent</div>
            <div className={s.stateD}>
              Check WhatsApp — your 6-week plan is on the way. First message in ~1 min.
            </div>
            <ShareButton publicResultId={publicResultId} score={result.score} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={s.root}>
      <div className={s.shell}>
        <div className={s.topbar}>
          <span className={s.wm}>
            Readiness<em>.</em>
          </span>
          <span className={s.eyebrow}>Your result</span>
        </div>

        <div className={s.center}>
          <p className={s.eyebrow} style={{ marginTop: 16 }}>
            AI-Readiness Score
          </p>
          <div className={s.ring}>
            <svg viewBox="0 0 184 184" aria-hidden="true">
              <circle cx="92" cy="92" r="78" fill="none" stroke="#262D3A" strokeWidth="6" />
              <circle
                cx="92"
                cy="92"
                r="78"
                fill="none"
                stroke="#C6F24E"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC * (1 - result.score / 100)}
              />
            </svg>
            <div className={s.score} aria-label={`AI-Readiness Score ${result.score} out of 100`}>
              {display}
              <small>/100</small>
            </div>
          </div>

          <p className={s.verdict}>{result.verdict}</p>
          <p className={s.proof}>
            Ahead of ~{result.percentile}% of final-years · based on hiring signals for 2026 fresher
            roles
          </p>
          <p className={s.basis}>Based on: skills · projects · AI tools · interview readiness</p>

          {result.gaps.map((g) => (
            <div className={s.gap} key={g.category}>
              <div className={s.gapTop}>
                <span>{g.label}</span>
                <span className={s.gapPct}>{g.percent}%</span>
              </div>
              <div className={s.bar}>
                <i style={{ width: `${g.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        {token ? (
          <CaptureForm
            publicResultId={publicResultId}
            token={token}
            score={result.score}
            gaps={result.gaps.map((g) => g.label)}
            onDone={() => setPhase("done")}
          />
        ) : (
          <div style={{ marginTop: 18 }}>
            <a href="/score" className={`${s.btn} ${s.btnLime}`}>
              Check my own score →
            </a>
            <ShareButton publicResultId={publicResultId} score={result.score} />
          </div>
        )}
      </div>
    </main>
  );
}

// ── Capture: WhatsApp-first, explicit split consent (DESIGN.md) ─────────────
function CaptureForm({
  publicResultId,
  token,
  score,
  gaps,
  onDone,
}: {
  publicResultId: string;
  token: string;
  score: number;
  gaps: string[];
  onDone: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState(true);
  const [intel, setIntel] = useState(false);
  const [partner, setPartner] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneInvalid = touched && !/^\d{10}$/.test(phone);

  async function submit() {
    setTouched(true);
    if (!/^\d{10}$/.test(phone)) return;
    setSubmitting(true);
    setError(null);
    const res = await captureLead({
      publicResultId,
      captureToken: token,
      phoneCountry: "+91",
      phone,
      email,
      consentPlan: plan,
      consentIntel: intel,
      consentPartner: partner,
      company: "",
    });
    setSubmitting(false);
    if (res.success) {
      try {
        sessionStorage.removeItem(`readiness.token.${publicResultId}`);
      } catch {
        /* non-fatal */
      }
      onDone();
    } else {
      setError(res.error);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <p className={s.score} style={{ fontSize: 28, textAlign: "left" }}>
        Your plan for <span className={s.gapPct}>{score}</span>
      </p>

      <div className={s.planCard}>
        <p className="h" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>
          6-WEEK PLAN · {gaps.length} GAPS
        </p>
        <p className="b" style={{ fontSize: 13, lineHeight: 1.6 }}>
          {gaps.map((g) => (
            <span key={g}>
              ▸ Close {g.toLowerCase()}
              <br />
            </span>
          ))}
        </p>
      </div>

      <div className={s.field}>
        <label htmlFor="r-phone">WhatsApp number</label>
        <div className={s.phoneGrp}>
          <span className={s.cc}>+91</span>
          <input
            id="r-phone"
            className={`${s.input} ${phoneInvalid ? s.inputErr : ""}`}
            style={{ flex: 1 }}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onBlur={() => setTouched(true)}
          />
        </div>
        {phoneInvalid && <p className={s.errmsg}>Enter a 10-digit number</p>}
      </div>

      <div className={s.field}>
        <label htmlFor="r-email">
          Email <span className="opt" style={{ color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>— optional</span>
        </label>
        <input
          id="r-email"
          className={s.input}
          type="email"
          autoComplete="email"
          placeholder="you@college.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <label className={s.consent}>
        <input type="checkbox" checked={plan} onChange={(e) => setPlan(e.target.checked)} />
        <span>
          Send my plan on WhatsApp <span className={s.req}>(required)</span>
        </span>
      </label>
      <label className={s.consent}>
        <input type="checkbox" checked={intel} onChange={(e) => setIntel(e.target.checked)} />
        <span>Also send weekly AI-career intel</span>
      </label>
      <label className={s.consent}>
        <input type="checkbox" checked={partner} onChange={(e) => setPartner(e.target.checked)} />
        <span>Share relevant openings from hiring &amp; upskilling partners</span>
      </label>

      {error && <p className={s.errmsg} style={{ marginBottom: 10 }}>{error}</p>}

      <button className={`${s.btn} ${s.btnLime}`} disabled={submitting || !plan} onClick={submit}>
        {submitting ? "Sending…" : "Send my plan →"}
      </button>
      <p className={s.fineprint}>
        Simple English · No login · <a href="/privacy">Privacy</a>
      </p>
    </div>
  );
}

function ShareButton({ publicResultId, score }: { publicResultId: string; score: number }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/score/result/${publicResultId}`;
    const text = `I scored ${score}/100 on my AI-Readiness check. What's yours?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My AI-Readiness Score", text, url });
        return;
      }
    } catch {
      /* user cancelled or unsupported — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing more we can do */
    }
  }
  return (
    <button className={s.btnText} onClick={share}>
      {copied ? "Link copied ✓" : "Share my score ↗"}
    </button>
  );
}

// Count-up reveal — the emotional beat. Honors reduced-motion (instant set).
function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, reduced]);
  return value;
}
