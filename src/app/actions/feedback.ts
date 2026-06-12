"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────
// Kept deliberately permissive on the human-facing fields (a one-word "love it"
// is valid feedback) but strict on shape so the triage table stays clean.
const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  category: z.enum(["bug", "idea", "ux", "pricing", "praise", "other"]).default("other"),
  message: z
    .string()
    .trim()
    .min(2, "Please add a few words so we can actually act on it.")
    .max(2000, "That's a lot — please keep it under 2000 characters."),
  email: z
    .string()
    .trim()
    .email("That email doesn't look right.")
    .max(254)
    .optional()
    .or(z.literal("")),
  name: z.string().trim().max(120).optional(),
  page: z.string().trim().max(512).optional(),
  // Honeypot: real users never fill this hidden field; bots do.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type FeedbackResult =
  | { success: true }
  | { success: false; error: string };

export async function submitFeedback(input: unknown): Promise<FeedbackResult> {
  // 1. Validate.
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || "Please check your feedback and try again.";
    return { success: false, error: first };
  }
  const data = parsed.data;

  // 2. Silently drop honeypot hits — pretend success so bots don't probe.
  if (data.company && data.company.length > 0) {
    return { success: true };
  }

  // 3. Attach the signed-in user if we have one (best effort).
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;
  try {
    const user = await currentUser();
    if (user) {
      userId = user.id;
      userEmail = user.emailAddresses?.[0]?.emailAddress ?? null;
      userName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    }
  } catch {
    /* auth is optional for feedback */
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("submitFeedback: Supabase config missing");
    return {
      success: false,
      error: "We couldn't save that right now. Please try again in a moment.",
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const email = (data.email && data.email.length > 0 ? data.email : userEmail) || null;
  const name = data.name || userName || null;

  // 4. Persist. This is the source of truth — email is just a nicety on top.
  const { error } = await supabaseAdmin.from("feedback").insert({
    user_id: userId,
    email,
    name,
    rating: data.rating ?? null,
    category: data.category,
    message: data.message,
    page: data.page || null,
    status: "new",
  });

  if (error) {
    console.error("submitFeedback insert error:", error);
    return {
      success: false,
      error: "Something went wrong saving your feedback. Please try again.",
    };
  }

  // 5. Notify the founder, best effort. A feedback table nobody reads is
  //    useless; this makes every message land in a human inbox immediately.
  //    Never let an email failure break the user's success experience.
  try {
    await notifyFounder({
      rating: data.rating,
      category: data.category,
      message: data.message,
      email,
      name,
      page: data.page,
      userId,
    });
  } catch (e) {
    console.error("submitFeedback notify error (non-fatal):", e);
  }

  return { success: true };
}

// ─── Founder notification ────────────────────────────────────────────────────
const RATING_LABEL: Record<number, string> = {
  1: "😖 Terrible (1)",
  2: "🙁 Bad (2)",
  3: "😐 Okay (3)",
  4: "🙂 Good (4)",
  5: "🤩 Amazing (5)",
};

const CATEGORY_LABEL: Record<string, string> = {
  bug: "🐞 Bug",
  idea: "💡 Feature idea",
  ux: "🧭 Confusing UX",
  pricing: "💳 Pricing",
  praise: "❤️ Praise",
  other: "💬 Other",
};

async function notifyFounder(f: {
  rating?: number;
  category: string;
  message: string;
  email: string | null;
  name: string | null;
  page?: string;
  userId: string | null;
}) {
  const to = process.env.FEEDBACK_NOTIFY_EMAIL || process.env.TEST_EMAIL || "";
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!to || !apiKey) return; // nothing configured — skip quietly

  const from = process.env.MARKETING_FROM || "Jobing AI <updates@jobing.site>";
  const resend = new Resend(apiKey);

  const ratingLine = f.rating ? RATING_LABEL[f.rating] : "— no rating —";
  const who = f.name || f.email || (f.userId ? "signed-in user" : "anonymous");
  const replyLine = f.email
    ? `<a href="mailto:${escapeHtml(f.email)}">Reply to ${escapeHtml(f.email)}</a>`
    : "No email provided — anonymous.";

  const subject = `${CATEGORY_LABEL[f.category] || "Feedback"} · ${ratingLine.replace(/^[^ ]+ /, "")} — Jobing`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h2 style="margin:0 0 4px;font-size:18px;">New feedback on Jobing</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">From <strong>${escapeHtml(who)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:90px;">Mood</td><td style="padding:6px 0;">${ratingLine}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Category</td><td style="padding:6px 0;">${CATEGORY_LABEL[f.category] || f.category}</td></tr>
        ${f.page ? `<tr><td style="padding:6px 0;color:#6b7280;">Page</td><td style="padding:6px 0;">${escapeHtml(f.page)}</td></tr>` : ""}
      </table>
      <div style="margin:16px 0;padding:16px;background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;white-space:pre-wrap;line-height:1.6;font-size:15px;">${escapeHtml(f.message)}</div>
      <p style="font-size:13px;color:#6b7280;">${replyLine}</p>
    </div>`;

  const emailPayload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    replyTo?: string;
  } = { from, to: [to], subject, html };
  if (f.email) emailPayload.replyTo = f.email;

  await resend.emails.send(emailPayload);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
