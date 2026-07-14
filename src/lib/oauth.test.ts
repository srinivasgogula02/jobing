import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));

let oauth: typeof import("./oauth");

beforeAll(async () => {
  oauth = await import("./oauth");
});

beforeEach(() => {
  vi.unstubAllEnvs();
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

  it("validates RFC 7636 challenge and verifier shapes", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(oauth.isValidPkceVerifier(verifier)).toBe(true);
    expect(oauth.isValidPkceVerifier("short")).toBe(false);
    expect(oauth.isValidPkceS256Challenge(oauth.pkceS256Challenge(verifier))).toBe(true);
  });

  it("creates deterministic SHA-256 hashes without returning the original secret", () => {
    const first = oauth.sha256("secret-token");
    expect(first).toBe(oauth.sha256("secret-token"));
    expect(first).not.toContain("secret-token");
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("OAuth public URL discovery", () => {
  it("uses the configured issuer and ignores caller-controlled proxy host headers", () => {
    vi.stubEnv("OAUTH_ISSUER", "https://jobing.site");
    const request = new Request("http://internal:3000/discovery", {
      headers: {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });
    expect(oauth.getBaseUrl(request)).toBe("https://jobing.site");
  });

  it("defaults localhost hosts to HTTP", () => {
    vi.stubEnv("OAUTH_ISSUER", "");
    const request = new Request("http://localhost:3000/discovery", {
      headers: { host: "localhost:3000" },
    });
    expect(oauth.getBaseUrl(request)).toBe("http://localhost:3000");
  });

  it("requires an explicit issuer for production and preview deployments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OAUTH_ISSUER", "");
    expect(() => oauth.getBaseUrl(new Request("https://preview.example/path")))
      .toThrow("OAUTH_ISSUER is required");
  });

  it("supports an explicitly configured preview issuer", () => {
    vi.stubEnv("OAUTH_ISSUER", "https://preview.jobing.site");
    expect(oauth.getBaseUrl(new Request("https://internal.vercel.app/path"))).toBe("https://preview.jobing.site");
  });

  it("canonicalizes the configured issuer origin", () => {
    vi.stubEnv("OAUTH_ISSUER", "https://JOBING.site:443/");
    expect(oauth.getBaseUrl(new Request("https://internal.vercel.app/path"))).toBe("https://jobing.site");
  });

  it.each([
    "http://jobing.site",
    "https://jobing.site/oauth",
    "https://jobing.site?tenant=other",
    "https://jobing.site#other",
    "https://admin:secret@jobing.site",
  ])("rejects a non-canonical or unsafe configured issuer: %s", (issuer) => {
    vi.stubEnv("OAUTH_ISSUER", issuer);
    expect(() => oauth.getBaseUrl(new Request("https://internal.vercel.app/path"))).toThrow(/OAUTH_ISSUER/);
  });

  it("advertises only PKCE public-client flows", () => {
    const metadata = oauth.authorizationServerMetadata("https://jobing.site");
    expect(metadata).toMatchObject({
      issuer: "https://jobing.site",
      authorization_endpoint: "https://jobing.site/oauth/authorize",
      token_endpoint: "https://jobing.site/api/oauth/token",
      registration_endpoint: "https://jobing.site/api/oauth/register",
      scopes_supported: ["notes:write", "pages:write", "forms:read", "forms:write", "forms:publish"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  });

  it("advertises the exact MCP resource URL used by clients", () => {
    expect(oauth.protectedResourceMetadata("https://jobing.site")).toEqual({
      resource: "https://jobing.site/mcp",
      authorization_servers: ["https://jobing.site"],
      scopes_supported: ["notes:write", "pages:write", "forms:read", "forms:write", "forms:publish"],
      bearer_methods_supported: ["header"],
      resource_name: "Jobing",
    });
  });
});
