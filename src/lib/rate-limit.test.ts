import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { rateLimit, requestIp } from "./rate-limit";

afterEach(() => vi.useRealTimers());

describe("in-memory request limiting", () => {
  it("allows requests up to the limit and rejects the next request", () => {
    const key = `limit-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("allows requests again after the window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const key = `reset-${crypto.randomUUID()}`;
    expect(rateLimit(key, 1, 1_000)).toBe(true);
    expect(rateLimit(key, 1, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_000);
    expect(rateLimit(key, 1, 1_000)).toBe(true);
  });
});

describe("request IP extraction", () => {
  it("uses the first address in a forwarded chain", () => {
    const request = new Request("https://jobing.site", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(requestIp(request)).toBe("203.0.113.9");
  });

  it("returns a stable fallback when no forwarding header exists", () => {
    expect(requestIp(new Request("https://jobing.site"))).toBe("unknown");
  });
});
