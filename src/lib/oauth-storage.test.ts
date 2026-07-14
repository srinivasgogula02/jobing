import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db }));

import {
  consumeConnectorRateLimit,
  exchangeAuthorizationCode,
  rotateRefreshToken,
  validateAccessTokenInfo,
} from "./oauth";

beforeEach(() => {
  vi.unstubAllEnvs();
  db.rpc.mockReset();
});

describe("atomic OAuth storage calls", () => {
  it("exchanges a code through one RPC and never sends raw tokens to Supabase", async () => {
    db.rpc.mockResolvedValue({ data: { scope: "mcp", grant_id: "grant-1" }, error: null });
    const result = await exchangeAuthorizationCode({
      code: "jbac_secret",
      clientId: "client-1",
      redirectUri: "https://app.example/callback",
      codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      resource: "https://jobing.site/mcp",
    });

    expect(db.rpc).toHaveBeenCalledWith("oauth_exchange_authorization_code", expect.objectContaining({
      p_client_id: "client-1",
      p_resource: "https://jobing.site/mcp",
      p_access_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_refresh_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(JSON.stringify(db.rpc.mock.calls[0][1])).not.toContain("jbat_");
    expect(JSON.stringify(db.rpc.mock.calls[0][1])).not.toContain("jbrt_");
    expect(result).toMatchObject({ scope: "notes:write pages:write", grant_id: "grant-1" });
    expect(result?.access_token).toMatch(/^jbat_/);
    expect(result?.refresh_token).toMatch(/^jbrt_/);
  });

  it("rotates a refresh token through one RPC with an optional downscope", async () => {
    db.rpc.mockResolvedValue({ data: { scope: "forms:read", grant_id: "grant-2" }, error: null });
    const result = await rotateRefreshToken({
      refreshToken: "jbrt_old",
      clientId: "client-1",
      resource: "https://jobing.site/mcp",
      requestedScopes: ["forms:read"],
    });

    expect(db.rpc).toHaveBeenCalledWith("oauth_rotate_refresh_token", expect.objectContaining({
      p_refresh_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_requested_scope: "forms:read",
    }));
    expect(result).toMatchObject({ scope: "forms:read", grant_id: "grant-2" });
  });

  it("returns null when the database rejects a consumed, expired, or mismatched grant", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });
    await expect(exchangeAuthorizationCode({
      code: "bad",
      clientId: "client-1",
      redirectUri: "https://app.example/callback",
      codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      resource: "https://jobing.site/mcp",
    })).resolves.toBeNull();
  });

  it("validates access tokens atomically against a live user and issuer", async () => {
    vi.stubEnv("OAUTH_ISSUER", "https://jobing.site");
    db.rpc.mockResolvedValue({
      data: {
        user_id: "user_live",
        client_id: "client-1",
        scope: "forms:read",
        grant_id: "d415cfb9-f55f-4e9d-99f0-11c0a796282b",
        access_expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    });

    await expect(validateAccessTokenInfo("jbat_secret")).resolves.toMatchObject({
      userId: "user_live",
      scope: "forms:read",
    });
    expect(db.rpc).toHaveBeenCalledWith("oauth_validate_access_token", {
      p_access_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_resource: "https://jobing.site/mcp",
      p_issuer: "https://jobing.site",
    });
  });

  it("fails access-token validation closed on missing users or database errors", async () => {
    vi.stubEnv("OAUTH_ISSUER", "https://jobing.site");
    db.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(validateAccessTokenInfo("jbat_orphan")).resolves.toBeNull();

    db.rpc.mockResolvedValueOnce({ data: null, error: { code: "08006" } });
    await expect(validateAccessTokenInfo("jbat_failure")).resolves.toBeNull();
  });

  it("uses a distributed grant bucket for connector throttling", async () => {
    db.rpc.mockResolvedValue({ data: true, error: null });
    await expect(consumeConnectorRateLimit("d415cfb9-f55f-4e9d-99f0-11c0a796282b")).resolves.toBe(true);
    expect(db.rpc).toHaveBeenCalledWith("oauth_consume_rate_limit", {
      p_grant_id: "d415cfb9-f55f-4e9d-99f0-11c0a796282b",
      p_bucket_key: "mcp",
      p_limit: 120,
      p_window_seconds: 60,
    });
  });

  it("fails the distributed limiter closed on invalid grants or database errors", async () => {
    await expect(consumeConnectorRateLimit("not-a-grant")).resolves.toBe(false);
    expect(db.rpc).not.toHaveBeenCalled();

    db.rpc.mockResolvedValue({ data: null, error: { code: "08006" } });
    await expect(consumeConnectorRateLimit("d415cfb9-f55f-4e9d-99f0-11c0a796282b")).resolves.toBe(false);
  });
});
