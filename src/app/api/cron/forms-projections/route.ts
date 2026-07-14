import { NextRequest, NextResponse } from "next/server";
import { drainFormsProjectionOutbox } from "@/lib/forms-projection-outbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  return secret.length >= 32 && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await drainFormsProjectionOutbox(25);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[forms/outbox] cron failed", error instanceof Error ? { name: error.name } : { type: typeof error });
    return NextResponse.json(
      { error: "delivery_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = handle;
export const POST = handle;
