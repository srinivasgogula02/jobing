import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPublicPage: vi.fn() }));

vi.mock("@/lib/page-store", () => ({ getPublicPage: mocks.getPublicPage }));

import { GET } from "./route";

function context(path?: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe("Pages Runtime document route", () => {
  beforeEach(() => {
    vi.stubEnv("PAGES_ROOT_DOMAIN", "jobing.online");
    mocks.getPublicPage.mockReset();
    mocks.getPublicPage.mockResolvedValue({
      html_content: "<!doctype html><html><body><h1>FreshMart</h1></body></html>",
      updated_at: "2026-07-14T00:00:00.000Z",
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("serves a wildcard root document with isolation and short CDN caching", async () => {
    const response = await GET(new Request("https://freshmart-job-application.jobing.online/"), context());

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<h1>FreshMart</h1>");
    expect(mocks.getPublicPage).toHaveBeenCalledWith("freshmart-job-application");
    expect(response.headers.get("origin-agent-cluster")).toBe("?1");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    );
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, s-maxage=15, stale-while-revalidate=45");
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/);
  });

  it("returns a conditional 304 for an unchanged document", async () => {
    const first = await GET(new Request("https://launch.jobing.online/"), context());
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();

    const response = await GET(new Request("https://launch.jobing.online/", {
      headers: { "if-none-match": `W/${etag}` },
    }), context());

    expect(response.status).toBe(304);
    expect(await response.text()).toBe("");
    expect(response.headers.get("etag")).toBe(etag);
  });

  it("uses exactly one path segment only on the legacy Vercel host", async () => {
    const response = await GET(
      new Request("https://jobing-pages.vercel.app/launch"),
      context(["launch"]),
    );
    expect(response.status).toBe(200);
    expect(mocks.getPublicPage).toHaveBeenCalledWith("launch");
  });

  it.each([
    ["https://launch.jobing.online/favicon.ico", ["favicon.ico"]],
    ["https://launch.jobing.online/anything", ["anything"]],
    ["https://jobing-pages.vercel.app/launch/anything", ["launch", "anything"]],
  ])("does not render a page document for %s", async (url, path) => {
    const response = await GET(new Request(url), context(path));
    expect(response.status).toBe(404);
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, s-maxage=5");
    expect(mocks.getPublicPage).not.toHaveBeenCalled();
  });

  it("returns a controlled, uncached response when storage is unavailable", async () => {
    mocks.getPublicPage.mockRejectedValue(new Error("database unavailable"));
    const response = await GET(new Request("https://launch.jobing.online/"), context());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain("database unavailable");
  });
});
