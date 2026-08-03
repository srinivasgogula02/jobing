import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureError: vi.fn(),
  getPublicPage: vi.fn(),
  getPublicPageByCustomDomain: vi.fn(),
  recordCompletion: vi.fn(),
}));

vi.mock("@/lib/page-store", () => ({ getPublicPage: mocks.getPublicPage, getPublicPageByCustomDomain: mocks.getPublicPageByCustomDomain }));
vi.mock("@/lib/server-telemetry", () => ({
  capturePagesOperationalError: mocks.captureError,
  durationBucket: () => "lt_100ms",
  recordPageRequestCompletion: mocks.recordCompletion,
}));

import { GET } from "./route";

const context = { params: Promise.resolve({ path: undefined }) };

describe("Pages Runtime request telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PAGES_ROOT_DOMAIN", "jobing.online");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("records one completion without a hostname, path, page ID, or HTML", async () => {
    mocks.getPublicPage.mockResolvedValue({ html_content: "<!doctype html><h1>Private draft copy</h1>" });
    const response = await GET(new Request("https://launch.jobing.online/"), context);

    expect(response.status).toBe(200);
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.recordCompletion).toHaveBeenCalledWith({
      outcome: "served",
      reason: "published",
      status_code: 200,
      route_mode: "subdomain",
      duration_bucket: "lt_100ms",
    });
    for (const key of ["host", "path", "page_id", "html"]) {
      expect(mocks.recordCompletion.mock.calls[0]?.[0]).not.toHaveProperty(key);
    }
  });

  it("records and reports a controlled storage failure once", async () => {
    const error = new Error("database unavailable");
    mocks.getPublicPage.mockRejectedValue(error);
    const response = await GET(new Request("https://launch.jobing.online/"), context);

    expect(response.status).toBe(503);
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(mocks.captureError).toHaveBeenCalledWith(error, {
      outcome: "unavailable",
      reason: "load_failed",
      status_code: 503,
      route_mode: "subdomain",
      duration_bucket: "lt_100ms",
    });
  });
});
