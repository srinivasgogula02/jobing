import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "@sentry/nextjs";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(() => Promise.resolve()),
  posthogConstructor: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
  waitUntil: vi.fn(),
  withScope: vi.fn((callback: (scope: { setContext: typeof mocks.setContext; setTag: typeof mocks.setTag }) => void) => callback({ setContext: mocks.setContext, setTag: mocks.setTag })),
}));

vi.mock("posthog-node", () => ({
  PostHog: class MockPostHog {
    constructor(...args: unknown[]) { mocks.posthogConstructor(...args); }
    capture = mocks.capture;
    flush = mocks.flush;
  },
}));
vi.mock("@vercel/functions", () => ({ waitUntil: mocks.waitUntil }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
  withScope: mocks.withScope,
}));

import { isServerTelemetryEnabled, scrubSentryEvent } from "@/lib/observability-config";
import {
  capturePagesOperationalError,
  recordPageRequestCompletion,
  sanitizePageRequestTelemetry,
  shouldRecordPageRequest,
  type PageRequestTelemetry,
} from "@/lib/server-telemetry";

const completion: PageRequestTelemetry = {
  outcome: "served",
  reason: "published",
  status_code: 200,
  route_mode: "subdomain",
  duration_bucket: "lt_100ms",
};

describe("Pages Runtime server telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    delete process.env.POSTHOG_PROJECT_TOKEN;
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.JOBING_OBSERVABILITY_ENABLED;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("is off for local and preview environments unless explicitly enabled", () => {
    expect(isServerTelemetryEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "preview", JOBING_OBSERVABILITY_ENABLED: "true" })).toBe(true);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("does nothing when PostHog is not configured", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => recordPageRequestCompletion(completion)).not.toThrow();
    expect(mocks.posthogConstructor).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("sends only the allowlisted completion dimensions", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_test");
    const unsafe = {
      ...completion,
      host: "secret.jobing.online",
      path: "/secret-page",
      page_id: "secret-page",
      html: "<form>secret</form>",
      origin: "https://customer.example",
      ip: "203.0.113.5",
    } as unknown as PageRequestTelemetry;

    recordPageRequestCompletion(unsafe);

    const event = mocks.capture.mock.calls[0]?.[0];
    expect(event.event).toBe("generated_page_request_completed");
    expect(event.disableGeoip).toBe(true);
    expect(event.properties).toMatchObject({
      service: "pages-runtime",
      environment: "production",
      outcome: "served",
      reason: "published",
      status_code: 200,
      route_mode: "subdomain",
      duration_bucket: "lt_100ms",
      sampling_rate: 0.1,
      $process_person_profile: false,
    });
    for (const key of ["host", "path", "page_id", "html", "origin", "ip"]) {
      expect(event.properties).not.toHaveProperty(key);
    }
  });

  it("drops unknown keys and invalid dimension values", () => {
    expect(sanitizePageRequestTelemetry({
      ...completion,
      route_mode: "secret.jobing.online",
      html: "<form>secret</form>",
    })).toEqual({
      outcome: "served",
      reason: "published",
      status_code: 200,
      duration_bucket: "lt_100ms",
    });
  });

  it("samples successful page serves at ten percent but retains every error", () => {
    expect(shouldRecordPageRequest({ status_code: 200 }, () => 0.099)).toBe(true);
    expect(shouldRecordPageRequest({ status_code: 304 }, () => 0.1)).toBe(false);
    expect(shouldRecordPageRequest({ status_code: 404 }, () => 0.99)).toBe(true);
    expect(shouldRecordPageRequest({ status_code: 503 }, () => 0.99)).toBe(true);
  });

  it("scrubs generated-page data from Sentry events", () => {
    const event = {
      request: { url: "https://secret.jobing.online", data: "<form>secret</form>" },
      user: { email: "person@example.com", ip_address: "203.0.113.5" },
      breadcrumbs: [{ message: "secret" }],
      contexts: { page: { html: "<form>secret</form>" } },
      extra: { page_id: "secret-page" },
      tags: { service: "pages-runtime", host: "secret.jobing.online" },
      exception: { values: [{ value: "load failed for secret-page", stacktrace: { frames: [{ vars: { html: "secret" } }] } }] },
    } as unknown as Event;

    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.contexts).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.tags).toEqual({ service: "pages-runtime" });
    expect(scrubbed.exception?.values?.[0]?.value).toBe("Pages Runtime operational error");
    expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars).toBeUndefined();
  });

  it("never throws when either analytics or error reporting fails", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("SENTRY_DSN", "https://public@example.invalid/1");
    mocks.capture.mockImplementationOnce(() => { throw new Error("analytics down"); });
    mocks.withScope.mockImplementationOnce(() => { throw new Error("sentry down"); });

    expect(() => recordPageRequestCompletion(completion)).not.toThrow();
    expect(() => capturePagesOperationalError(new Error("database down"), completion)).not.toThrow();
  });
});
