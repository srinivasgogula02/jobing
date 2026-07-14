import { afterEach, describe, expect, it, vi } from "vitest";
import { publicPageAddressAffixes, publicPageUrl } from "./pages-runtime-url";

afterEach(() => vi.unstubAllEnvs());

describe("publicPageUrl", () => {
  it("uses the path fallback before a domain is attached", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_RUNTIME_URL", "https://jobing-pages.vercel.app/");
    expect(publicPageUrl("launch-page")).toBe("https://jobing-pages.vercel.app/launch-page");
  });

  it("uses a unique hostname after a wildcard domain is attached", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "https://jobing.online/");
    expect(publicPageUrl("launch-page")).toBe("https://launch-page.jobing.online");
    expect(publicPageAddressAffixes()).toEqual({ prefix: "", suffix: ".jobing.online" });
  });

  it("returns path-mode address affixes before the wildcard is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_RUNTIME_URL", "https://jobing-pages.vercel.app/");
    expect(publicPageAddressAffixes()).toEqual({ prefix: "jobing-pages.vercel.app/", suffix: "" });
  });

  it("falls back instead of constructing a hostname from malformed configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "https://jobing.online/path");
    expect(publicPageUrl("launch-page")).toBe("https://jobing-pages.vercel.app/launch-page");
  });
});
