import { Resend } from "resend";
import { marked } from "marked";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Config ───────────────────────────────────────────────
const DAILY_CAP = parseInt(process.env.DAILY_EMAIL_CAP || "100", 10);
const FROM = process.env.MARKETING_FROM || "Jobing AI <updates@jobing.site>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://jobing.site";

export function getAdminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, serviceKey);
}

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY || "");
}

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string;
  emails_sent_count?: number;
}

export interface Broadcast {
  id: string;
  subject: string;
  body_md: string;
  total_target: number;
  sent_count: number;
}

// ── Rendering ────────────────────────────────────────────
function firstName(name: string | null): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
}

// URL-safe slug from the first name, e.g. "Srinivas" -> "srinivas".
function nameSlug(name: string | null): string {
  const first = firstName(name);
  const slug = first
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug && slug !== "there" ? slug : "you";
}

export function renderEmailHtml(
  markdownBody: string,
  subscriber: Pick<Subscriber, "name" | "unsubscribe_token">
): string {
  // Personalize body placeholders before rendering markdown.
  const personalizedBody = markdownBody
    .replace(/\{\{\s*first_name\s*\}\}/g, firstName(subscriber.name))
    .replace(/\{\{\s*slug\s*\}\}/g, nameSlug(subscriber.name));
  const bodyHtml = marked.parse(personalizedBody, { async: false }) as string;
  const unsubUrl = `${APP_URL}/api/email/unsubscribe?token=${subscriber.unsubscribe_token}`;
  const greeting = `Hi ${firstName(subscriber.name)},`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
@media (max-width: 600px) {
  .email-wrapper { padding: 16px 12px; }
  .email-card { padding: 20px; }
}
@media (min-width: 601px) {
  .email-wrapper { padding: 32px 20px; }
  .email-card { padding: 32px; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div class="email-wrapper" style="max-width:560px;margin:0 auto;">
    <div class="email-card" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;">
      <img src="https://ugdrybcvyucwhuoyykfg.supabase.co/storage/v1/object/public/images/Chat-GPT-Image-Jun-8-2026-04-35-47-PM%20(1).png" alt="Jobing AI" style="width:100%;height:auto;display:block;margin:0 0 24px;border-radius:8px;">
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#1a1a1a;">${greeting}</p>
      <div style="font-size:15px;line-height:1.65;color:#333333;">
        ${bodyHtml}
      </div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;text-align:center;">
        <div style="margin-bottom:20px;">
          <img src="https://jobing.site/logo.png" alt="Jobing AI" style="height:32px;width:auto;border-radius:6px;display:inline-block;vertical-align:middle;margin-right:12px;">
          <span style="font-size:18px;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em;display:inline-block;vertical-align:middle;">Jobing AI</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 12px;">Jobing AI. Deploy your AI agent to get hired.</p>
        <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
          Don't want these emails?
          <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function unsubHeaders(token: string) {
  const url = `${APP_URL}/api/email/unsubscribe?token=${token}`;
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// ── Daily budget ─────────────────────────────────────────
export async function todaysBudgetRemaining(supabase: SupabaseClient): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", startOfDay.toISOString());

  if (error) {
    console.error("budget count error:", error);
    return 0;
  }
  return Math.max(0, DAILY_CAP - (count || 0));
}

// ── Audience selection ───────────────────────────────────
export async function pickNextBatch(
  supabase: SupabaseClient,
  broadcastId: string,
  limit: number
): Promise<Subscriber[]> {
  if (limit <= 0) return [];

  // Subscribers already sent this broadcast (skip them).
  const { data: sentRows, error: sentErr } = await supabase
    .from("email_sends")
    .select("subscriber_id")
    .eq("broadcast_id", broadcastId);

  if (sentErr) {
    console.error("sent lookup error:", sentErr);
    return [];
  }
  const sentIds = new Set((sentRows || []).map((r) => r.subscriber_id));

  // Active subscribers, longest-dormant first. List is small (~hundreds),
  // so we fetch and filter the already-sent ones in memory.
  const { data: subs, error: subErr } = await supabase
    .from("email_subscribers")
    .select("id, email, name, unsubscribe_token, emails_sent_count")
    .eq("status", "active")
    .order("last_emailed_at", { ascending: true, nullsFirst: true })
    .limit(limit + sentIds.size);

  if (subErr) {
    console.error("subscriber fetch error:", subErr);
    return [];
  }

  return (subs || []).filter((s) => !sentIds.has(s.id)).slice(0, limit);
}

// ── Sending ──────────────────────────────────────────────
export interface BatchResult {
  sent: number;
  failed: number;
  remaining: number;
  completed: boolean;
}

export async function sendBroadcastBatch(
  supabase: SupabaseClient,
  broadcast: Broadcast,
  requestedLimit: number
): Promise<BatchResult> {
  const budget = await todaysBudgetRemaining(supabase);
  const limit = Math.min(requestedLimit, budget);

  const batch = await pickNextBatch(supabase, broadcast.id, limit);

  if (batch.length === 0) {
    // Nothing left to send for this broadcast today. Determine if complete.
    const { count } = await supabase
      .from("email_sends")
      .select("id", { count: "exact", head: true })
      .eq("broadcast_id", broadcast.id);
    const totalSent = count || 0;
    const remaining = Math.max(0, broadcast.total_target - totalSent);
    if (remaining === 0) {
      await markCompleted(supabase, broadcast.id);
    }
    return { sent: 0, failed: 0, remaining, completed: remaining === 0 };
  }

  const resend = getResend();
  const payloads = batch.map((s) => ({
    from: FROM,
    to: [s.email],
    subject: broadcast.subject,
    html: renderEmailHtml(broadcast.body_md, s),
    headers: unsubHeaders(s.unsubscribe_token),
  }));

  const { data, error } = await resend.batch.send(payloads);

  if (error) {
    console.error("resend batch error:", error);
    return { sent: 0, failed: batch.length, remaining: -1, completed: false };
  }

  // Resend returns { data: [{ id }, ...] } aligned to payload order.
  const ids: Array<{ id?: string }> = (data as any)?.data || [];
  const nowIso = new Date().toISOString();

  // Log all sends in a single batch insert. The UNIQUE(broadcast_id,
  // subscriber_id) constraint + ignoreDuplicates makes this idempotent, so a
  // retry never double-logs. Batching keeps the function well under its timeout.
  const sendRows = batch.map((sub, i) => ({
    broadcast_id: broadcast.id,
    subscriber_id: sub.id,
    email: sub.email,
    status: "sent",
    resend_message_id: ids[i]?.id || null,
    sent_at: nowIso,
  }));

  const { error: logErr } = await supabase
    .from("email_sends")
    .upsert(sendRows, {
      onConflict: "broadcast_id,subscriber_id",
      ignoreDuplicates: true,
    });

  if (logErr) {
    console.error("batch log insert failed:", logErr);
    return { sent: 0, failed: batch.length, remaining: -1, completed: false };
  }

  // Bump last_emailed_at + emails_sent_count for everyone in one round trip.
  const sentIds = batch.map((s) => s.id);
  const { error: rpcErr } = await supabase.rpc("mark_emails_sent", {
    p_ids: sentIds,
  });
  if (rpcErr) console.error("mark_emails_sent rpc failed:", rpcErr);

  const sent = batch.length;

  // Recompute totals + completion.
  const { count } = await supabase
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .eq("broadcast_id", broadcast.id);
  const totalSent = count || 0;

  await supabase
    .from("email_broadcasts")
    .update({ sent_count: totalSent })
    .eq("id", broadcast.id);

  const remaining = Math.max(0, broadcast.total_target - totalSent);
  const completed = remaining === 0;
  if (completed) await markCompleted(supabase, broadcast.id);

  return { sent, failed: batch.length - sent, remaining, completed };
}

async function markCompleted(supabase: SupabaseClient, broadcastId: string) {
  await supabase
    .from("email_broadcasts")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", broadcastId);
}

export async function sendTestEmail(
  subject: string,
  markdownBody: string,
  toEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const fakeSub = { name: "Srinivas", unsubscribe_token: "test-token" };
  const { error } = await resend.emails.send({
    from: FROM,
    to: [toEmail],
    subject: `[TEST] ${subject}`,
    html: renderEmailHtml(markdownBody, fakeSub),
  });
  if (error) return { ok: false, error: String(error) };
  return { ok: true };
}

export async function countActiveSubscribers(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("email_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  return count || 0;
}
