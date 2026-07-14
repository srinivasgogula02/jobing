import { describe, expect, it } from "vitest";
import {
  isAllowedOAuthRedirectUri,
  normalizeUntrustedClientName,
  oauthClientDisplayIdentity,
  oauthRedirectOrigin,
} from "./oauth-client-metadata";

describe("OAuth client metadata", () => {
  it("accepts HTTPS and native loopback redirects only", () => {
    expect(isAllowedOAuthRedirectUri("https://app.example/callback?connection=1")).toBe(true);
    expect(isAllowedOAuthRedirectUri("http://127.0.0.1:54321/callback")).toBe(true);
    expect(isAllowedOAuthRedirectUri("http://[::1]:54321/callback")).toBe(true);
    expect(isAllowedOAuthRedirectUri("http://app.example/callback")).toBe(false);
    expect(isAllowedOAuthRedirectUri("javascript:alert(1)")).toBe(false);
  });

  it("rejects misleading redirect syntax", () => {
    expect(isAllowedOAuthRedirectUri("https://app.example/callback#code")).toBe(false);
    expect(isAllowedOAuthRedirectUri("https://trusted.example@evil.example/callback")).toBe(false);
    expect(isAllowedOAuthRedirectUri(" https://app.example/callback")).toBe(false);
  });

  it("normalizes the redirect origin to a safe, comparable identity", () => {
    expect(oauthRedirectOrigin("https://CHATGPT.com:443/oauth/callback?state=1"))
      .toBe("https://chatgpt.com");
    expect(oauthRedirectOrigin("https://chatgpt.com.evil.example/callback"))
      .toBe("https://chatgpt.com.evil.example");
  });

  it("strips controls, direction overrides, and markup-like brackets from unverified names", () => {
    expect(normalizeUntrustedClientName(" \u202e<ChatGPT>\u0000\n Connector "))
      .toBe("ChatGPT Connector");
  });

  it("uses the selected registered redirect origin as identity and keeps the name unverified", () => {
    expect(oauthClientDisplayIdentity({
      redirect_uris: [
        "https://first.example/callback",
        "https://chatgpt.com.evil.example/callback",
      ],
      client_name: "ChatGPT",
    }, "https://chatgpt.com.evil.example/callback")).toEqual({
      redirectOrigin: "https://chatgpt.com.evil.example",
      unverifiedName: "ChatGPT",
    });
  });
});
