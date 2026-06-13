import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSupabase,
  sendBroadcastBatch,
  sendTestEmail,
  countActiveSubscribers,
  Broadcast,
} from "@/lib/email";

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const secret = process.env.ADMIN_SECRET || "";
  return secret.length > 0 && header === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    subject?: string;
    markdown?: string;
    test?: boolean;
    bannerUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const subject = (body.subject || "").trim();
  const markdown = (body.markdown || "").trim();
  const bannerUrl = (body.bannerUrl || "").trim() || null;
  if (!subject || !markdown) {
    return NextResponse.json(
      { error: "subject and markdown are required" },
      { status: 400 }
    );
  }

  // Test path — send only to the user's own inbox, create no broadcast.
  if (body.test) {
    const testEmail = process.env.TEST_EMAIL || "";
    if (!testEmail) {
      return NextResponse.json(
        { error: "TEST_EMAIL not configured" },
        { status: 500 }
      );
    }
    const result = await sendTestEmail(subject, markdown, testEmail, bannerUrl);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, test: true, sentTo: testEmail });
  }

  // Real broadcast — create the row, send the first batch within today's budget.
  const supabase = getAdminSupabase();
  const totalTarget = await countActiveSubscribers(supabase);

  if (totalTarget === 0) {
    return NextResponse.json(
      { error: "no active subscribers" },
      { status: 400 }
    );
  }

  const { data: created, error: createErr } = await supabase
    .from("email_broadcasts")
    .insert({
      subject,
      body_md: markdown,
      banner_url: bannerUrl,
      status: "sending",
      total_target: totalTarget,
      sent_count: 0,
    })
    .select("id, subject, body_md, banner_url, total_target, sent_count")
    .single();

  if (createErr || !created) {
    console.error("broadcast create error:", createErr);
    return NextResponse.json(
      { error: "failed to create broadcast" },
      { status: 500 }
    );
  }

  const broadcast = created as Broadcast;
  const result = await sendBroadcastBatch(supabase, broadcast, 100);

  return NextResponse.json({
    ok: true,
    broadcastId: broadcast.id,
    totalTarget,
    ...result,
  });
}
