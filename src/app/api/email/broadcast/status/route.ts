import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, todaysBudgetRemaining } from "@/lib/email";

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const secret = process.env.ADMIN_SECRET || "";
  return secret.length > 0 && header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();

  const { data: broadcasts, error } = await supabase
    .from("email_broadcasts")
    .select("id, subject, status, total_target, sent_count, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("status fetch error:", error);
    return NextResponse.json({ error: "failed to fetch" }, { status: 500 });
  }

  const budgetRemaining = await todaysBudgetRemaining(supabase);

  const items = (broadcasts || []).map((b) => ({
    id: b.id,
    subject: b.subject,
    status: b.status,
    sent: b.sent_count,
    total: b.total_target,
    remaining: Math.max(0, (b.total_target || 0) - (b.sent_count || 0)),
    created_at: b.created_at,
    completed_at: b.completed_at,
  }));

  return NextResponse.json({ budgetRemaining, broadcasts: items });
}
