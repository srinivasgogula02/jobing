// AI-Readiness Score — pure, deterministic scoring engine (E1).
//
// No I/O, no randomness, no Date. Same answers in → same score out, forever.
// This is the trust anchor: a student who retakes with the same answers must see
// the same number, and the share-card / result must be reproducible from the
// stored answers + score_version alone. All persistence lives in the server
// action; this file only does math so it can be unit-tested in isolation.

export const SCORE_VERSION = 1;

export type Category = "AI_TOOLING" | "PROJECT_PROOF" | "FUNDAMENTALS";

export const CATEGORY_LABEL: Record<Category, string> = {
  AI_TOOLING: "AI TOOLING",
  PROJECT_PROOF: "PROJECT PROOF",
  FUNDAMENTALS: "FUNDAMENTALS",
};

export interface QuestionOption {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  category: Category;
  /** Short mono category eyebrow shown above the prompt. */
  prompt: string;
  /** Optional low-pressure helper ("Pick the closest"). */
  help?: string;
  options: QuestionOption[];
}

// 9 questions, 3 per category. Options are ordered low→high readiness; `points`
// is what that answer is worth. Keep max points equal within a category so the
// category percent is a clean earned/possible ratio.
export const QUESTIONS: Question[] = [
  // ── AI TOOLING ──────────────────────────────────────────────────────────
  {
    id: "ai_use",
    category: "AI_TOOLING",
    prompt: "How often do you use AI tools (ChatGPT, Copilot) in your actual project work?",
    help: "No right answer — pick the closest.",
    options: [
      { label: "Never tried them", points: 0 },
      { label: "Sometimes, for quick answers", points: 1 },
      { label: "Daily, built into how I work", points: 2 },
      { label: "I build with AI APIs myself", points: 3 },
    ],
  },
  {
    id: "ai_build",
    category: "AI_TOOLING",
    prompt: "Have you built anything that calls an AI model or API?",
    options: [
      { label: "No, and not sure how", points: 0 },
      { label: "Followed a tutorial once", points: 1 },
      { label: "Built a small working demo", points: 2 },
      { label: "Shipped something people used", points: 3 },
    ],
  },
  {
    id: "ai_prompt",
    category: "AI_TOOLING",
    prompt: "How confident are you writing prompts that actually get good results?",
    options: [
      { label: "I mostly copy what others use", points: 0 },
      { label: "I can tweak prompts a bit", points: 1 },
      { label: "I iterate to get what I want", points: 2 },
      { label: "I design prompts for a system", points: 3 },
    ],
  },
  // ── PROJECT PROOF ───────────────────────────────────────────────────────
  {
    id: "proj_count",
    category: "PROJECT_PROOF",
    prompt: "How many real projects can you show a recruiter today?",
    options: [
      { label: "None yet", points: 0 },
      { label: "One college project", points: 1 },
      { label: "Two or three", points: 2 },
      { label: "A portfolio I'm proud of", points: 3 },
    ],
  },
  {
    id: "proj_ship",
    category: "PROJECT_PROOF",
    prompt: "Is any of your work live — a deployed link, app, or public repo?",
    options: [
      { label: "Nothing public", points: 0 },
      { label: "Code on GitHub, not deployed", points: 1 },
      { label: "One deployed link", points: 2 },
      { label: "Several, with real users", points: 3 },
    ],
  },
  {
    id: "proj_solo",
    category: "PROJECT_PROOF",
    prompt: "Could you rebuild your best project from scratch on your own?",
    options: [
      { label: "No, I followed a guide", points: 0 },
      { label: "Parts of it", points: 1 },
      { label: "Most of it", points: 2 },
      { label: "Yes, and explain every line", points: 3 },
    ],
  },
  // ── FUNDAMENTALS ────────────────────────────────────────────────────────
  {
    id: "fund_dsa",
    category: "FUNDAMENTALS",
    prompt: "How comfortable are you with data structures & algorithms?",
    options: [
      { label: "Shaky on the basics", points: 0 },
      { label: "Know the basics", points: 1 },
      { label: "Solve medium problems", points: 2 },
      { label: "Strong, solve under pressure", points: 3 },
    ],
  },
  {
    id: "fund_cs",
    category: "FUNDAMENTALS",
    prompt: "Can you explain how the web works end to end (request → server → DB → response)?",
    options: [
      { label: "Not really", points: 0 },
      { label: "Roughly", points: 1 },
      { label: "Yes, with detail", points: 2 },
      { label: "Yes, and the trade-offs", points: 3 },
    ],
  },
  {
    id: "fund_interview",
    category: "FUNDAMENTALS",
    prompt: "How ready do you feel for a technical interview right now?",
    options: [
      { label: "I'd freeze", points: 0 },
      { label: "I'd struggle", points: 1 },
      { label: "I'd hold my own", points: 2 },
      { label: "Bring it on", points: 3 },
    ],
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

/** answers maps question id → selected option index. Missing/invalid → 0. */
export type Answers = Record<string, number>;

export type Band = "behind" | "ontrack" | "ahead";

export interface Gap {
  category: Category;
  label: string;
  percent: number;
}

export interface ScoreResult {
  score: number; // 0–100
  band: Band;
  verdict: string;
  /** "ahead of ~N% of final-years" — derived monotonically from score. */
  percentile: number;
  gaps: Gap[]; // up to 3, lowest category first (biggest gap)
  categoryPercents: Record<Category, number>;
  scoreVersion: number;
}

const CATEGORIES: Category[] = ["AI_TOOLING", "PROJECT_PROOF", "FUNDAMENTALS"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Sanitize one answer to a valid option index for its question. */
function optionIndex(q: Question, raw: number | undefined): number {
  if (typeof raw !== "number" || !Number.isInteger(raw)) return 0;
  return clamp(raw, 0, q.options.length - 1);
}

export function computeScore(answers: Answers): ScoreResult {
  const earned: Record<Category, number> = { AI_TOOLING: 0, PROJECT_PROOF: 0, FUNDAMENTALS: 0 };
  const possible: Record<Category, number> = { AI_TOOLING: 0, PROJECT_PROOF: 0, FUNDAMENTALS: 0 };

  for (const q of QUESTIONS) {
    const idx = optionIndex(q, answers[q.id]);
    const maxPoints = Math.max(...q.options.map((o) => o.points));
    earned[q.category] += q.options[idx].points;
    possible[q.category] += maxPoints;
  }

  const categoryPercents = {} as Record<Category, number>;
  for (const c of CATEGORIES) {
    categoryPercents[c] = possible[c] === 0 ? 0 : Math.round((earned[c] / possible[c]) * 100);
  }

  const score = Math.round(
    CATEGORIES.reduce((sum, c) => sum + categoryPercents[c], 0) / CATEGORIES.length,
  );

  const band: Band = score >= 70 ? "ahead" : score >= 40 ? "ontrack" : "behind";
  const gaps = deriveGaps(categoryPercents);
  const verdict = makeVerdict(band, gaps);

  // Percentile: monotonic, honest-ish curve. A 0 isn't "ahead of nobody" and a
  // 100 isn't "ahead of everybody" — final-years cluster in the middle.
  const percentile = clamp(Math.round(score * 0.85 + 6), 3, 97);

  return { score, band, verdict, percentile, gaps, categoryPercents, scoreVersion: SCORE_VERSION };
}

/** Lowest categories first; these are the "next upgrades" on the share-card. */
export function deriveGaps(categoryPercents: Record<Category, number>): Gap[] {
  return [...CATEGORIES]
    .map((c) => ({ category: c, label: CATEGORY_LABEL[c], percent: categoryPercents[c] }))
    // Sort ascending by percent; stable tie-break on fixed category order so the
    // result is deterministic when two categories tie.
    .sort((a, b) => a.percent - b.percent || CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category));
}

function makeVerdict(band: Band, gaps: Gap[]): string {
  // Count gaps that are genuinely weak (below 60). Phrase warmly, never alarmist.
  const weak = gaps.filter((g) => g.percent < 60).length;
  const gapWord = weak === 1 ? "one gap" : `${weak} gaps`;
  if (band === "ahead") {
    return weak === 0
      ? "You're ahead of most — and ready to apply."
      : `You're ahead of most — with ${gapWord} to close.`;
  }
  if (band === "ontrack") {
    return `You're on track — close ${gapWord} and you'll stand out.`;
  }
  return weak <= 1
    ? "Early days — one focused month changes this fast."
    : `Early days — but ${gapWord} are fixable in weeks, not years.`;
}

/** One aspirational line for the Instagram Story card (never "weaknesses"). */
export function aspirationalLine(result: ScoreResult): string {
  const topGap = result.gaps[0];
  if (result.band === "ahead") {
    return `AI-ready — sharpening ${topGap.label.toLowerCase()} for top roles.`;
  }
  if (result.band === "ontrack") {
    return `On track for 2026 roles — next upgrade: ${topGap.label.toLowerCase()}.`;
  }
  return `Building toward AI-ready — starting with ${topGap.label.toLowerCase()}.`;
}
