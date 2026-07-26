import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runIntegrationDeliveries } from "@/lib/integration-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/u, "") ?? "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Unauthorized." } }, { status: 401 });
  }
  const result = await runIntegrationDeliveries({ limit: 25 });
  return NextResponse.json({ data: result }, { headers: { "cache-control": "no-store" } });
}
