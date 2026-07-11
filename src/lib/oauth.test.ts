import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));

let oauth: typeof import("./oauth");

beforeAll(async () => {
  oauth = await import("./oauth");
});

describe("OAuth security helpers", () => {
  it("accepts the matching S256 PKCE verifier and rejects another verifier", () => {
    // RFC 7636 Appendix B example pair.
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    expect(oauth.verifyPkceS256(verifier, challenge)).toBe(true);
    expect(oauth.verifyPkceS256("different-verifier", challenge)).toBe(false);
  });

  it("returns false rather than throwing when a PKCE challenge has a different length", () => {
    expect(oauth.verifyPkceS256("verifier", "short")).toBe(false);
  });

  it("creates deterministic SHA-256 hashes without returning the original secret", () => {
    const first = oauth.sha256("secret-token");
    expect(first).toBe(oauth.sha256("secret-token"));
    expect(first).not.toContain("secret-token");
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("OAuth public URL discovery", () => {
  it("uses trusted proxy headers for production and preview deployments", () => {
    const request = new Request("http://internal:3000/discovery", {
      headers: {
        "x-forwarded-host": "jobing.site",
        "x-forwarded-proto": "https",
      },
    });
    expect(oauth.getBaseUrl(request)).toBe("https://jobing.site");
  });

  it("defaults localhost hosts to HTTP", () => {
    const request = new Request("http://localhost:3000/discovery", {
      headers: { host: "localhost:3000" },
    });
    expect(oauth.getBaseUrl(request)).toBe("http://localhost:3000");
  });

  it("falls back to the request origin when host headers are unavailable", () => {
    expect(oauth.getBaseUrl(new Request("https://preview.jobing.site/path"))).toBe("https://preview.jobing.site");
  });

  it("advertises only PKCE public-client flows", () => {
    const metadata = oauth.authorizationServerMetadata("https://jobing.site");
    expect(metadata).toMatchObject({
      issuer: "https://jobing.site",
      authorization_endpoint: "https://jobing.site/oauth/authorize",
      token_endpoint: "https://jobing.site/api/oauth/token",
      registration_endpoint: "https://jobing.site/api/oauth/register",
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  });

  it("advertises the exact MCP resource URL used by clients", () => {
    expect(oauth.protectedResourceMetadata("https://jobing.site")).toEqual({
      resource: "https://jobing.site/mcp",
      authorization_servers: ["https://jobing.site"],
      scopes_supported: ["mcp"],
      bearer_methods_supported: ["header"],
      resource_name: "Jobing",
    });
  });
});
