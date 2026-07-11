import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ registerClient: vi.fn(), rateLimit: vi.fn() }));

vi.mock("@/lib/oauth", () => ({ registerClient: mocks.registerClient }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, requestIp: () => "203.0.113.5" }));

import { OPTIONS, POST } from "./route";

function registrationRequest(body: unknown) {
  return new NextRequest("https://jobing.site/api/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.rateLimit.mockReturnValue(true);
  mocks.registerClient.mockResolvedValue({
    client_id: "jbcl_test",
    redirect_uris: ["https://chatgpt.com/callback"],
    client_name: "ChatGPT",
    token_endpoint_auth_method: "none",
    created_at: "2026-01-01T00:00:00Z",
  });
});

describe("OAuth dynamic client registration", () => {
  it("rejects redirects that could send authorization codes over unsafe HTTP", async () => {
    const response = await POST(registrationRequest({ redirect_uris: ["http://evil.example/callback"] }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_redirect_uri" });
    expect(mocks.registerClient).not.toHaveBeenCalled();
  });

  it("allows HTTPS and native loopback redirects while removing duplicates and unsafe entries", async () => {
    const response = await POST(registrationRequest({
      redirect_uris: [
        "https://chatgpt.com/callback",
        "https://chatgpt.com/callback",
        "http://127.0.0.1:54321/callback",
        "javascript:alert(1)",
      ],
      client_name: "  ChatGPT  ",
    }));

    expect(response.status).toBe(201);
    expect(mocks.registerClient).toHaveBeenCalledWith({
      redirect_uris: ["https://chatgpt.com/callback", "http://127.0.0.1:54321/callback"],
      client_name: "ChatGPT",
    });
    expect(await response.json()).toMatchObject({
      client_id: "jbcl_test",
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    });
  });

  it("returns a controlled error when registration storage fails", async () => {
    mocks.registerClient.mockRejectedValue(new Error("database secret details"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(registrationRequest({ redirect_uris: ["https://chatgpt.com/callback"] }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
    consoleError.mockRestore();
  });

  it("returns CORS preflight headers", async () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
