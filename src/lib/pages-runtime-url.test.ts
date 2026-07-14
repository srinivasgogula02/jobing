import { afterEach, describe, expect, it, vi } from "vitest";
import { publicPageUrl } from "./pages-runtime-url";

afterEach(() => vi.unstubAllEnvs());

describe("publicPageUrl", () => {
  it("uses the path fallback before a domain is attached", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_RUNTIME_URL", "https://jobing-pages.vercel.app/");
    expect(publicPageUrl("launch-page")).toBe("https://jobing-pages.vercel.app/launch-page");
  });

  it("uses a unique hostname after a wildcard domain is attached", () => {
    vi.stubEnv("NEXT_PUBLIC_PAGES_ROOT_DOMAIN", "pages.example");
    expect(publicPageUrl("launch-page")).toBe("https://launch-page.pages.example");
  });
});

