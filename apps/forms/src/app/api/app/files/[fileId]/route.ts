import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSubmissionFile } from "@/lib/forms-store";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = await getSubmissionFile(userId, (await params).fileId);
  if (!file || file.scanStatus === "blocked") return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  const safeName = file.fileName.replace(/["\\\r\n]/gu, "_");
  return new NextResponse(Buffer.from(file.contentBase64, "base64"), { headers: {
    "content-type": "application/octet-stream",
    "content-length": String(file.byteSize),
    "content-disposition": `attachment; filename="${safeName}"`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  } });
}
