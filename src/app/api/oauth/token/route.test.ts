import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  consumeAuthCode: vi.fn(),
  issueTokens: vi.fn(),
  rotateRefreshToken: vi.fn(),
  verifyPkceS256: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/oauth", () => ({
  consumeAuthCode: mocks.consumeAuthCode,
  issueTokens: mocks.issueTokens,
  rotateRefreshToken: mocks.rotateRefreshToken,
  verifyPkceS256: mocks.verifyPkceS256,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, requestIp: () => "203.0.113.5" }));

import { POST } from "./route";

function tokenRequest(params: Record<string, string>) {
  return new NextRequest("https://jobing.site/api/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

beforeEach(() => {
  mocks.rateLimit.mockReturnValue(true);
  mocks.verifyPkceS256.mockReturnValue(true);
  mocks.consumeAuthCode.mockResolvedValue({
    client_id: "client-1", user_id: "user-1", redirect_uri: "https://app.example/callback",
    scope: "mcp", code_challenge: "challenge", code_challenge_method: "S256",
  });
  mocks.issueTokens.mockResolvedValue({
    access_token: "jbat_access", refresh_token: "jbrt_refresh", expires_in: 3600, scope: "mcp",
  });
});

describe("OAuth token exchange", () => {
  it("exchanges a valid authorization code and PKCE verifier without caching the response", async () => {
    const response = await POST(tokenRequest({
      grant_type: "authorization_code", code: "code", redirect_uri: "https://app.example/callback",
      client_id: "client-1", code_verifier: "verifier",
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      access_token: "jbat_access", token_type: "Bearer", expires_in: 3600,
      refresh_token: "jbrt_refresh", scope: "mcp",
    });
  });

  it.each([
    ["client_id mismatch", { client_id: "other", redirect_uri: "https://app.example/callback" }],
    ["redirect_uri mismatch", { client_id: "client-1", redirect_uri: "https://evil.example/callback" }],
  ])("rejects %s", async (_label, overrides) => {
    const response = await POST(tokenRequest({
      grant_type: "authorization_code", code: "code", code_verifier: "verifier", ...overrides,
    }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_grant");
    expect(mocks.issueTokens).not.toHaveBeenCalled();
  });

  it("rejects failed PKCE verification", async () => {
    mocks.verifyPkceS256.mockReturnValue(false);
    const response = await POST(tokenRequest({
      grant_type: "authorization_code", code: "code", redirect_uri: "https://app.example/callback",
      client_id: "client-1", code_verifier: "wrong",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_grant", error_description: "PKCE verification failed" });
  });

  it("returns invalid_grant for expired or replayed authorization codes", async () => {
    mocks.consumeAuthCode.mockResolvedValue(null);
    const response = await POST(tokenRequest({
      grant_type: "authorization_code", code: "used-code", redirect_uri: "https://app.example/callback",
      client_id: "client-1", code_verifier: "verifier",
    }));
    expect(await response.json()).toMatchObject({ error: "invalid_grant" });
  });

  it("rotates a valid refresh token", async () => {
    mocks.rotateRefreshToken.mockResolvedValue({
      access_token: "jbat_new", refresh_token: "jbrt_new", expires_in: 3600, scope: "mcp",
    });
    const response = await POST(tokenRequest({
      grant_type: "refresh_token", refresh_token: "jbrt_old", client_id: "client-1",
    }));
    expect(response.status).toBe(200);
    expect(mocks.rotateRefreshToken).toHaveBeenCalledWith({ refreshToken: "jbrt_old", clientId: "client-1" });
    expect(await response.json()).toMatchObject({ access_token: "jbat_new", refresh_token: "jbrt_new" });
  });

  it("rejects unsupported grant types", async () => {
    const response = await POST(tokenRequest({ grant_type: "password" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "unsupported_grant_type" });
  });
});
