import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeAuthorizationCode: vi.fn(),
  rotateRefreshToken: vi.fn(),
  isValidPkceVerifier: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/oauth", () => ({
  exchangeAuthorizationCode: mocks.exchangeAuthorizationCode,
  rotateRefreshToken: mocks.rotateRefreshToken,
  isValidPkceVerifier: mocks.isValidPkceVerifier,
  getMcpResourceUrl: () => "https://jobing.site/mcp",
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

function rawTokenRequest(body: string, contentType: string) {
  return new NextRequest("https://jobing.site/api/oauth/token", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

beforeEach(() => {
  mocks.rateLimit.mockReturnValue(true);
  mocks.isValidPkceVerifier.mockReturnValue(true);
  mocks.exchangeAuthorizationCode.mockResolvedValue({
    access_token: "jbat_access",
    refresh_token: "jbrt_refresh",
    expires_in: 3600,
    scope: "notes:write pages:write forms:read forms:write forms:publish",
    grant_id: "grant-1",
  });
});

describe("OAuth token exchange", () => {
  it("atomically exchanges a matching authorization code without caching the response", async () => {
    const response = await POST(tokenRequest({
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "https://app.example/callback",
      client_id: "client-1",
      code_verifier: "valid-verifier",
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.exchangeAuthorizationCode).toHaveBeenCalledWith({
      code: "code",
      clientId: "client-1",
      redirectUri: "https://app.example/callback",
      codeVerifier: "valid-verifier",
      resource: "https://jobing.site/mcp",
    });
    expect(await response.json()).toEqual({
      access_token: "jbat_access",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "jbrt_refresh",
      scope: "notes:write pages:write forms:read forms:write forms:publish",
    });
  });

  it("returns one generic invalid_grant response for a mismatched, expired, or replayed code", async () => {
    mocks.exchangeAuthorizationCode.mockResolvedValue(null);
    const response = await POST(tokenRequest({
      grant_type: "authorization_code",
      code: "used-code",
      redirect_uri: "https://evil.example/callback",
      client_id: "other-client",
      code_verifier: "valid-verifier",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_grant" });
  });

  it("rejects a malformed PKCE verifier before database access", async () => {
    mocks.isValidPkceVerifier.mockReturnValue(false);
    const response = await POST(tokenRequest({
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "https://app.example/callback",
      client_id: "client-1",
      code_verifier: "short",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_grant" });
    expect(mocks.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects a token requested for another resource", async () => {
    const response = await POST(tokenRequest({
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "https://app.example/callback",
      client_id: "client-1",
      code_verifier: "valid-verifier",
      resource: "https://evil.example/mcp",
    }));
    expect(await response.json()).toMatchObject({ error: "invalid_target" });
    expect(mocks.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rotates a valid refresh token while preserving its resource and optional downscope", async () => {
    mocks.rotateRefreshToken.mockResolvedValue({
      access_token: "jbat_new",
      refresh_token: "jbrt_new",
      expires_in: 3600,
      scope: "forms:read",
      grant_id: "grant-1",
    });
    const response = await POST(tokenRequest({
      grant_type: "refresh_token",
      refresh_token: "jbrt_old",
      client_id: "client-1",
      scope: "forms:read",
    }));
    expect(response.status).toBe(200);
    expect(mocks.rotateRefreshToken).toHaveBeenCalledWith({
      refreshToken: "jbrt_old",
      clientId: "client-1",
      resource: "https://jobing.site/mcp",
      requestedScopes: ["forms:read"],
    });
    expect(await response.json()).toMatchObject({ access_token: "jbat_new", refresh_token: "jbrt_new", scope: "forms:read" });
  });

  it("preserves a grant when a cached client refreshes with the legacy mcp alias", async () => {
    mocks.rotateRefreshToken.mockResolvedValue({
      access_token: "jbat_new",
      refresh_token: "jbrt_new",
      expires_in: 3600,
      scope: "notes:write pages:write forms:read forms:write forms:publish",
      grant_id: "grant-1",
    });
    const response = await POST(tokenRequest({
      grant_type: "refresh_token",
      refresh_token: "jbrt_old",
      client_id: "client-1",
      scope: "mcp",
    }));
    expect(response.status).toBe(200);
    expect(mocks.rotateRefreshToken).toHaveBeenCalledWith({
      refreshToken: "jbrt_old",
      clientId: "client-1",
      resource: "https://jobing.site/mcp",
      requestedScopes: undefined,
    });
  });

  it("rejects unsupported scopes on refresh", async () => {
    const response = await POST(tokenRequest({
      grant_type: "refresh_token",
      refresh_token: "jbrt_old",
      client_id: "client-1",
      scope: "forms.responses:delete",
    }));
    expect(await response.json()).toMatchObject({ error: "invalid_scope" });
    expect(mocks.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("bounds token request bodies", async () => {
    const response = await POST(tokenRequest({ grant_type: "authorization_code", code: "x".repeat(17_000) }));
    expect(await response.json()).toMatchObject({ error: "invalid_request", error_description: "Token request body is too large" });
    expect(mocks.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects token bodies sent with a different media type", async () => {
    const response = await POST(rawTokenRequest('{"grant_type":"authorization_code"}', "application/json"));
    expect(await response.json()).toMatchObject({
      error: "invalid_request",
      error_description: "Token requests must use application/x-www-form-urlencoded",
    });
    expect(mocks.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects unsupported grant types", async () => {
    const response = await POST(tokenRequest({ grant_type: "password" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "unsupported_grant_type" });
  });
});
