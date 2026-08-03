import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPublicPageByCustomDomain } from "./page-store";

describe("custom domain page storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses the narrow public resolver and never queries domain ownership rows directly", async () => {
    vi.stubEnv("SUPABASE_URL", "https://db.example");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon_test");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([
      { html_content: "<main>Contact</main>", updated_at: "2026-08-03T00:00:00.000Z" },
    ]), { status: 200, headers: { "content-type": "application/json" } }));

    await expect(getPublicPageByCustomDomain("pages.example.com", "contact"))
      .resolves.toMatchObject({ html_content: "<main>Contact</main>" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://db.example/rest/v1/rpc/resolve_custom_page");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ p_hostname: "pages.example.com", p_path: "contact" });
  });
});
