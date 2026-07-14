import { databaseConfigured, query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET() {
  if (!databaseConfigured()) {
    return Response.json(
      { error: { code: "database_not_configured", message: "The Forms database is not configured." } },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    await query("select 1");
    return Response.json(
      { data: { status: "ok", service: "jobing-forms", database: "reachable" } },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error(
      "[forms/health] database check failed",
      error instanceof Error ? { name: error.name, code: (error as { code?: string }).code } : { type: typeof error },
    );
    return Response.json(
      { error: { code: "database_unavailable", message: "The Forms database is unavailable." } },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
