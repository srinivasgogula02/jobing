import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getAdminSupabase } from "@/lib/email";

// Maps a Resend event type to the email_sends status we store.
const STATUS_MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const body = await req.text();

  let event: { type?: string; data?: { email_id?: string } };

  // Verify the Svix signature Resend sends. Fail closed if not configured.
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": req.headers.get("svix-id") || "",
      "svix-timestamp": req.headers.get("svix-timestamp") || "",
      "svix-signature": req.headers.get("svix-signature") || "",
    }) as typeof event;
  } catch (err) {
    console.error("resend webhook verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const type = event.type || "";
  const messageId = event.data?.email_id;
  const newStatus = STATUS_MAP[type];

  if (!newStatus || !messageId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = getAdminSupabase();

  // Update the per-recipient send log by Resend message id.
  const { data: send } = await supabase
    .from("email_sends")
    .update({ status: newStatus })
    .eq("resend_message_id", messageId)
    .select("subscriber_id")
    .maybeSingle();

  const nowIso = new Date().toISOString();

  if (type === "email.opened" && send?.subscriber_id) {
    await supabase
      .from("email_subscribers")
      .update({ last_opened_at: nowIso })
      .eq("id", send.subscriber_id);
  }

  // Hard bounce or complaint suppresses the subscriber.
  if ((type === "email.bounced" || type === "email.complained") && send?.subscriber_id) {
    const suppressStatus = type === "email.complained" ? "complained" : "bounced";
    await supabase
      .from("email_subscribers")
      .update({ status: suppressStatus, updated_at: nowIso })
      .eq("id", send.subscriber_id);
  }

  return NextResponse.json({ ok: true });
}
