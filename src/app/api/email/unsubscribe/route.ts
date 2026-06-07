import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/email";

function page(title: string, message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:480px;margin:80px auto;padding:32px 20px;text-align:center;">
    <div style="margin-bottom:24px;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Jobing AI</div>
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:40px 32px;">
      <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#6b7280;margin:0;">${message}</p>
    </div>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function unsubscribe(token: string): Promise<NextResponse> {
  if (!token) {
    return page("Invalid link", "This unsubscribe link is missing its token.");
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("email_subscribers")
    .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();

  if (error) {
    console.error("unsubscribe error:", error);
    return page("Something went wrong", "Please try again later.");
  }

  if (!data) {
    return page("Already handled", "You're already unsubscribed or the link is invalid.");
  }

  return page(
    "You're unsubscribed",
    "You won't receive any more marketing emails from Jobing AI. You can keep using your account as usual."
  );
}

// One-click List-Unsubscribe (POST) and link clicks (GET).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  return unsubscribe(token);
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  await unsubscribe(token);
  return new NextResponse(null, { status: 200 });
}
