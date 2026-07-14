import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listFormsForActor, listSubmissionsPage } from "@/lib/forms-store";
import { csvCell } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = (await listFormsForActor(userId)).find((item) => item.id === formId);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = new URL(request.url);
  const stateValue = url.searchParams.get("state");
  const state = stateValue === "spam" || stateValue === "archived" ? stateValue : "inbox";
  const sort = url.searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const query = (url.searchParams.get("q") || "").slice(0,200);
  const rows: Awaited<ReturnType<typeof listSubmissionsPage>>["items"] = [];
  for (let page=1; page<=100; page++) {
    const result = await listSubmissionsPage({actorId:userId,formId,state,sort,query,page,pageSize:100});
    rows.push(...result.items);
    if (page >= result.pages) break;
  }
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row.values)))];
  const lines = [["submission_id","received_at","review_state",...keys].map(csvCell).join(","), ...rows.map((row) => [row.id,row.receivedAt,row.reviewState,...keys.map((key) => Array.isArray(row.values[key]) ? (row.values[key] as unknown[]).join("; ") : row.values[key])].map(csvCell).join(","))];
  const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/^-|-$/gu,"").slice(0,60) || "responses";
  return new NextResponse(`\uFEFF${lines.join("\r\n")}`, { headers: { "content-type":"text/csv; charset=utf-8", "content-disposition":`attachment; filename="${slug}-${state}.csv"`, "cache-control":"private, no-store", "x-content-type-options":"nosniff" } });
}
