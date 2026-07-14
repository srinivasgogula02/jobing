import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db }));

import { getClient, registerClient } from "./oauth";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("OAUTH_ISSUER", "https://jobing.site");
});

describe("issuer-bound OAuth clients", () => {
  it("persists the canonical issuer with every dynamic registration", async () => {
    const stored = {
      client_id: "jbcl_test",
      issuer: "https://jobing.site",
      redirect_uris: ["https://app.example/callback"],
      client_name: "Example",
      token_endpoint_auth_method: "none",
      created_at: "2026-07-14T00:00:00Z",
    };
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.insert = vi.fn(() => query);
    query.select = vi.fn(() => query);
    query.single = vi.fn().mockResolvedValue({ data: stored, error: null });
    db.from.mockReturnValue(query);

    await expect(registerClient({
      redirect_uris: stored.redirect_uris,
      client_name: stored.client_name,
    })).resolves.toEqual(stored);

    expect(db.from).toHaveBeenCalledWith("oauth_clients");
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      client_id: expect.stringMatching(/^jbcl_/),
      issuer: "https://jobing.site",
      token_endpoint_auth_method: "none",
    }));
  });

  it("filters lookups by issuer and rejects a row from another issuer", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.maybeSingle = vi.fn().mockResolvedValue({
      data: {
        client_id: "jbcl_preview",
        issuer: "https://preview.jobing.site",
        redirect_uris: ["https://app.example/callback"],
        client_name: "Example",
        token_endpoint_auth_method: "none",
        created_at: "2026-07-14T00:00:00Z",
      },
    });
    db.from.mockReturnValue(query);

    await expect(getClient("jbcl_preview")).resolves.toBeNull();
    expect(query.eq).toHaveBeenNthCalledWith(1, "client_id", "jbcl_preview");
    expect(query.eq).toHaveBeenNthCalledWith(2, "issuer", "https://jobing.site");
  });
});
