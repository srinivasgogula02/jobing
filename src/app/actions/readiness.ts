"use server";

import { randomBytes } from "crypto";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  computeScore,
  QUESTIONS,
  SCORE_VERSION,
  type Answers,
  type ScoreResult,
} from "@/lib/readiness-score";

// ── Public result shape (no PII, no capture token) ──────────────────────────
export interface PublicResult {
  publicResultId: string;
  result: ScoreResult;
}

// ── Submit assessment ───────────────────────────────────────────────────────
// Anonymous. Scores deterministically, persists, and returns the opaque public
// id + the single-use capture token. The token is the owner's secret — the
// client keeps it in sessionStorage and presents it once at capture. A shared
// link only ever carries publicResultId, so it can't capture a lead.
export type SubmitResult =
  | { success: true; publicResultId: string; captureToken: string; result: ScoreResult }
  | { success: false; error: string };

const utmSchema = z
  .object({
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    referrer: z.string().max(512).optional(),
  })
  .partial()
  .optional();

const validIds = new Set(QUESTIONS.map((q) => q.id));

export async function submitAssessment(
  rawAnswers: unknown,
  rawUtm?: unknown,
): Promise<SubmitResult> {
  // Validate answers: object of questionId -> integer option index.
  if (typeof rawAnswers !== "object" || rawAnswers === null) {
    return { success: false, error: "Something went wrong reading your answers. Please retake." };
  }
  const answers: Answers = {};
  for (const [k, v] of Object.entries(rawAnswers as Record<string, unknown>)) {
    if (validIds.has(k) && typeof v === "number" && Number.isInteger(v)) {
      answers[k] = v;
    }
  }
  const utm = utmSchema.safeParse(rawUtm).success ? (rawUtm as Record<string, string>) : null;

  const result = computeScore(answers);
  const publicResultId = makePublicId();

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return { success: false, error: "We couldn't save your score right now. Please try again." };
  }

  const { data, error } = await admin
    .from("readiness_assessments")
    .insert({
      public_result_id: publicResultId,
      answers,
      score: result.score,
      band: result.band,
      verdict: result.verdict,
      percentile: result.percentile,
      gaps: result.gaps,
      category_percents: result.categoryPercents,
      score_version: SCORE_VERSION,
      utm,
    })
    .select("public_result_id, capture_token")
    .single();

  if (error || !data) {
    console.error("submitAssessment insert error:", error);
    return { success: false, error: "We couldn't save your score right now. Please try again." };
  }

  return {
    success: true,
    publicResultId: data.public_result_id,
    captureToken: data.capture_token,
    result,
  };
}

// ── Read a public result (for the result page + share-card) ─────────────────
// Returns score data only — never phone/email/token. Safe for shared links.
export async function getPublicResult(publicResultId: string): Promise<PublicResult | null> {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(publicResultId)) return null;
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return null;
  }
  const { data, error } = await admin
    .from("readiness_assessments")
    .select("public_result_id, score, band, verdict, percentile, gaps, category_percents, score_version, capture_used")
    .eq("public_result_id", publicResultId)
    .single();

  if (error || !data) return null;

  return {
    publicResultId: data.public_result_id,
    result: {
      score: data.score,
      band: data.band,
      verdict: data.verdict,
      percentile: data.percentile,
      gaps: data.gaps,
      categoryPercents: data.category_percents,
      scoreVersion: data.score_version,
    },
  };
}

// ── Capture lead (WhatsApp-first, explicit split consent) ───────────────────
const captureSchema = z.object({
  publicResultId: z.string().regex(/^[A-Za-z0-9_-]{6,40}$/),
  captureToken: z.string().uuid("Invalid session. Please retake your assessment."),
  phoneCountry: z.string().regex(/^\+\d{1,4}$/).default("+91"),
  phone: z.string().trim().regex(/^\d{6,15}$/, "Enter a valid number."),
  email: z.string().trim().email("That email doesn't look right.").max(254).optional().or(z.literal("")),
  // The plan consent is required (it's why they gave a number); intel/partner optional.
  consentPlan: z.boolean(),
  consentIntel: z.boolean().default(false),
  consentPartner: z.boolean().default(false),
  // Honeypot — bots fill this, humans never see it.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type CaptureResult = { success: true } | { success: false; error: string };

export async function captureLead(input: unknown): Promise<CaptureResult> {
  const parsed = captureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Please check the form and try again." };
  }
  const d = parsed.data;

  // Silently succeed on honeypot hits so bots don't learn anything.
  if (d.company && d.company.length > 0) return { success: true };

  if (!d.consentPlan) {
    return { success: false, error: "We need permission to send your plan on WhatsApp." };
  }

  // India 10-digit sanity check (kept friendly for other country codes).
  if (d.phoneCountry === "+91" && !/^\d{10}$/.test(d.phone)) {
    return { success: false, error: "Enter a 10-digit number." };
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return { success: false, error: "We couldn't send your plan right now. Your score is safe — try again." };
  }

  const { data, error } = await admin.rpc("readiness_capture_lead", {
    p_public_result_id: d.publicResultId,
    p_capture_token: d.captureToken,
    p_phone_country: d.phoneCountry,
    p_phone: d.phone,
    p_email: d.email || "",
    p_consents: { plan: d.consentPlan, intel: d.consentIntel, partner: d.consentPartner },
  });

  if (error) {
    console.error("captureLead rpc error:", error);
    return { success: false, error: "We couldn't send your plan right now. Your score is safe — try again." };
  }

  if (data === "notfound") {
    return { success: false, error: "We couldn't find that result. Please retake your assessment." };
  }
  if (data === "used") {
    // Already captured (or hijack attempt with a shared link). Treat the common
    // honest case — the owner double-submitting — as a soft success.
    return { success: true };
  }

  // Best-effort founder notification; never block the student's success on it.
  try {
    await notifyFounder({
      phone: `${d.phoneCountry} ${d.phone}`,
      email: d.email || null,
      publicResultId: d.publicResultId,
      intel: d.consentIntel,
      partner: d.consentPartner,
    });
  } catch (e) {
    console.error("captureLead notify error (non-fatal):", e);
  }

  return { success: true };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
// URL-safe, opaque, ~12 chars. Not sequential, carries no PII.
function makePublicId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function notifyFounder(l: {
  phone: string;
  email: string | null;
  publicResultId: string;
  intel: boolean;
  partner: boolean;
}) {
  const to = process.env.READINESS_NOTIFY_EMAIL || process.env.FEEDBACK_NOTIFY_EMAIL || process.env.TEST_EMAIL || "";
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!to || !apiKey) return;
  const from = process.env.MARKETING_FROM || "Jobing AI <updates@jobing.site>";
  const resend = new Resend(apiKey);
  const optins = [l.intel && "weekly intel", l.partner && "partner offers"].filter(Boolean).join(", ") || "plan only";
  await resend.emails.send({
    from,
    to: [to],
    subject: `New Readiness lead · ${l.phone}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;color:#1a1a1a;">
      <h2 style="margin:0 0 8px;font-size:17px;">New AI-Readiness lead</h2>
      <p style="margin:4px 0;">WhatsApp: <strong>${escapeHtml(l.phone)}</strong></p>
      ${l.email ? `<p style="margin:4px 0;">Email: ${escapeHtml(l.email)}</p>` : ""}
      <p style="margin:4px 0;color:#6b7280;">Opt-ins: ${escapeHtml(optins)}</p>
      <p style="margin:4px 0;color:#6b7280;">Result: ${escapeHtml(l.publicResultId)}</p>
    </div>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
