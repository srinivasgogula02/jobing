import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, sendBroadcastBatch, Broadcast } from "@/lib/email";

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  return secret.length > 0 && header === `Bearer ${secret}`;
}

// Continues any in-progress broadcast by sending the next batch within today's
// budget. Content-free: it only advances already-approved broadcasts.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();

  const { data: pending, error } = await supabase
    .from("email_broadcasts")
    .select("id, subject, body_md, banner_url, total_target, sent_count")
    .eq("status", "sending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("cron broadcast lookup error:", error);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  if (!pending) {
    return NextResponse.json({ ok: true, message: "nothing to send" });
  }

  const broadcast = pending as Broadcast;
  const result = await sendBroadcastBatch(supabase, broadcast, 100);

  return NextResponse.json({
    ok: true,
    broadcastId: broadcast.id,
    ...result,
  });
}
