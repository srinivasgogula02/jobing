import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONNECTOR_SCOPES, serializeOAuthScopes } from "@/lib/oauth-scopes";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createAuthCode: vi.fn(),
  getClient: vi.fn(),
  isValidPkceS256Challenge: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/oauth", () => ({
  createAuthCode: mocks.createAuthCode,
  getClient: mocks.getClient,
  getMcpResourceUrl: () => "https://jobing.site/mcp",
  isValidPkceS256Challenge: mocks.isValidPkceS256Challenge,
}));

import { approveAuthorization } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "user_123" });
  mocks.getClient.mockResolvedValue({
    client_id: "chatgpt-client",
    redirect_uris: ["https://chatgpt.com/connector/oauth/callback"],
  });
  mocks.isValidPkceS256Challenge.mockReturnValue(true);
  mocks.createAuthCode.mockResolvedValue("authorization-code");
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

describe("connector authorization approval", () => {
  it("expands a cached ChatGPT mcp request only after showing fresh consent", async () => {
    const form = new FormData();
    form.set("client_id", "chatgpt-client");
    form.set("redirect_uri", "https://chatgpt.com/connector/oauth/callback");
    form.set("state", "state-123");
    form.set("scope", "mcp");
    form.set("resource", "https://jobing.site/mcp");
    form.set("code_challenge", "valid-challenge");
    form.set("code_challenge_method", "S256");

    await expect(approveAuthorization(form)).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.createAuthCode).toHaveBeenCalledWith({
      clientId: "chatgpt-client",
      userId: "user_123",
      redirectUri: "https://chatgpt.com/connector/oauth/callback",
      scope: serializeOAuthScopes(DEFAULT_CONNECTOR_SCOPES),
      resource: "https://jobing.site/mcp",
      codeChallenge: "valid-challenge",
      codeChallengeMethod: "S256",
    });
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "https://chatgpt.com/connector/oauth/callback?code=authorization-code&state=state-123",
    );
  });
});
