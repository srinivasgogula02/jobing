"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, QUESTION_COUNT, CATEGORY_LABEL, type Answers } from "@/lib/readiness-score";
import { submitAssessment } from "@/app/actions/readiness";
import s from "../readiness.module.css";

const STORAGE_KEY = "readiness.progress";
const KEYS = ["A", "B", "C", "D", "E"];

type Saved = { step: number; answers: Answers };

export default function Assessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<"idle" | "scoring" | "error">("idle");
  const [restored, setRestored] = useState(false);

  // Resume: if a partial run exists, pick up where they left off (no exam-pressure).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        if (saved && typeof saved.step === "number" && saved.answers) {
          setAnswers(saved.answers);
          setStep(Math.min(saved.step, QUESTION_COUNT - 1));
        }
      }
    } catch {
      /* ignore corrupt state */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers } satisfies Saved));
    } catch {
      /* storage may be unavailable; non-fatal */
    }
  }, [step, answers, restored]);

  const q = QUESTIONS[step];

  function choose(optionIndex: number) {
    const next = { ...answers, [q.id]: optionIndex };
    setAnswers(next);
    if (step < QUESTION_COUNT - 1) {
      setStep(step + 1);
    } else {
      void finish(next);
    }
  }

  async function finish(finalAnswers: Answers) {
    setPhase("scoring");
    const utm = captureUtm();
    const res = await submitAssessment(finalAnswers, utm);
    if (!res.success) {
      setPhase("error");
      return;
    }
    try {
      // Hand the single-use capture token to the result page (owner secret).
      sessionStorage.setItem(`readiness.token.${res.publicResultId}`, res.captureToken);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
    router.push(`/score/result/${res.publicResultId}`);
  }

  if (!restored) return <main className={s.root} aria-hidden />;

  if (phase === "scoring") {
    return (
      <main className={s.root}>
        <div className={s.shell}>
          <div className={s.stateWrap}>
            <div className={s.spinner} role="status" aria-label="Scoring your answers" />
            <div className={s.stateT}>Scoring your answers</div>
            <div className={s.stateD}>Reading {QUESTION_COUNT} signals against 2026 fresher hiring data…</div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className={s.root}>
        <div className={s.shell}>
          <div className={s.stateWrap}>
            <div className={`${s.stateIcon} ${s.err}`}>!</div>
            <div className={s.stateT}>Couldn&apos;t score that</div>
            <div className={s.stateD}>Your answers are safe. We just couldn&apos;t reach the server — try once more.</div>
            <button className={`${s.btn} ${s.btnGhost}`} style={{ width: "auto", padding: "12px 28px" }} onClick={() => finish(answers)}>
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const progress = Math.round(((step + (answers[q.id] !== undefined ? 1 : 0)) / QUESTION_COUNT) * 100);

  return (
    <main className={s.root}>
      <div className={s.shell}>
        <div className={s.topbar}>
          <span className={s.wm}>
            Readiness<em>.</em>
          </span>
          <span className={s.qmeta}>
            {String(step + 1).padStart(2, "0")} / {QUESTION_COUNT}
          </span>
        </div>

        <div className={s.progress} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress}%` }} />
        </div>

        <p className={s.qmeta}>{CATEGORY_LABEL[q.category]}</p>
        <h1 className={s.qprompt}>{q.prompt}</h1>
        {q.help && <p className={s.qhelp}>{q.help}</p>}

        <div role="radiogroup" aria-label={q.prompt}>
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${s.option} ${selected ? s.optionSel : ""}`}
                onClick={() => choose(i)}
              >
                <span className={s.optionKey}>{KEYS[i]}</span>
                {opt.label}
              </button>
            );
          })}
        </div>

        {step > 0 && (
          <button
            className={`${s.btn} ${s.btnGhost}`}
            style={{ marginTop: 14 }}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
      </div>
    </main>
  );
}

function captureUtm(): Record<string, string> {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    const src = p.get("utm_source");
    const med = p.get("utm_medium");
    const camp = p.get("utm_campaign");
    if (src) utm.source = src;
    if (med) utm.medium = med;
    if (camp) utm.campaign = camp;
    if (document.referrer) utm.referrer = document.referrer.slice(0, 512);
    return utm;
  } catch {
    return {};
  }
}
