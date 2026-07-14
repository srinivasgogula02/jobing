import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  databaseConfigured: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/lib/db", () => db);

import { GET } from "./route";

beforeEach(() => {
  db.databaseConfigured.mockReset().mockReturnValue(true);
  db.query.mockReset().mockResolvedValue({ rows: [{ value: 1 }] });
});

describe("GET /api/health", () => {
  it("reports a reachable Forms database without cacheable output", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: { status: "ok", service: "jobing-forms", database: "reachable" } });
    expect(db.query).toHaveBeenCalledWith("select 1");
  });

  it("fails readiness when the database is not configured", async () => {
    db.databaseConfigured.mockReturnValue(false);
    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { code: "database_not_configured", message: "The Forms database is not configured." },
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  it("sanitizes database connectivity failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    db.query.mockRejectedValueOnce(new Error("password=secret connection failed"));
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: { code: "database_unavailable", message: "The Forms database is unavailable." } });
    expect(JSON.stringify(body)).not.toContain("password");
    consoleError.mockRestore();
  });
});
