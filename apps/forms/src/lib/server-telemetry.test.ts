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
  captureFormsOperationalError,
  recordFormSubmissionCompletion,
  sanitizeFormSubmissionTelemetry,
  type FormSubmissionTelemetry,
} from "@/lib/server-telemetry";

const completion: FormSubmissionTelemetry = {
  outcome: "accepted",
  reason: "success",
  status_code: 201,
  response_mode: "json",
  source: "generated_page",
  duration_bucket: "lt_100ms",
};

describe("Forms server telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.POSTHOG_PROJECT_TOKEN;
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.JOBING_OBSERVABILITY_ENABLED;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("is off for local and preview environments unless explicitly enabled", () => {
    expect(isServerTelemetryEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "preview", JOBING_OBSERVABILITY_ENABLED: "true" })).toBe(true);
    expect(isServerTelemetryEnabled({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("does nothing when PostHog is not configured", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => recordFormSubmissionCompletion(completion)).not.toThrow();
    expect(mocks.posthogConstructor).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("sends only the allowlisted completion dimensions", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_test");
    const unsafe = {
      ...completion,
      origin: "https://customer.example",
      email: "person@example.com",
      ip: "203.0.113.5",
      form_values: { message: "secret" },
      request_body: "secret",
    } as unknown as FormSubmissionTelemetry;

    recordFormSubmissionCompletion(unsafe);

    const event = mocks.capture.mock.calls[0]?.[0];
    expect(event.event).toBe("form_submission_completed");
    expect(event.disableGeoip).toBe(true);
    expect(event.properties).toMatchObject({
      service: "forms",
      environment: "production",
      outcome: "accepted",
      reason: "success",
      status_code: 201,
      response_mode: "json",
      source: "generated_page",
      duration_bucket: "lt_100ms",
      $process_person_profile: false,
    });
    expect(event.properties).not.toHaveProperty("origin");
    expect(event.properties).not.toHaveProperty("email");
    expect(event.properties).not.toHaveProperty("ip");
    expect(event.properties).not.toHaveProperty("form_values");
    expect(event.properties).not.toHaveProperty("request_body");
  });

  it("drops unknown keys and invalid dimension values", () => {
    expect(sanitizeFormSubmissionTelemetry({
      ...completion,
      outcome: "person@example.com",
      origin: "https://customer.example",
    })).toEqual({
      reason: "success",
      status_code: 201,
      response_mode: "json",
      source: "generated_page",
      duration_bucket: "lt_100ms",
    });
  });

  it("scrubs request and user content from Sentry events", () => {
    const event = {
      request: { data: { email: "person@example.com" }, headers: { origin: "https://customer.example" } },
      user: { email: "person@example.com", ip_address: "203.0.113.5" },
      breadcrumbs: [{ message: "secret" }],
      contexts: { unsafe: { html: "<form>secret</form>" } },
      extra: { form_values: { message: "secret" } },
      tags: { service: "forms", origin: "https://customer.example" },
      exception: { values: [{ value: "database error for person@example.com", stacktrace: { frames: [{ vars: { email: "person@example.com" } }] } }] },
    } as unknown as Event;

    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.contexts).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.tags).toEqual({ service: "forms" });
    expect(scrubbed.exception?.values?.[0]?.value).toBe("Forms operational error");
    expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars).toBeUndefined();
  });

  it("never throws when either analytics or error reporting fails", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("SENTRY_DSN", "https://public@example.invalid/1");
    mocks.capture.mockImplementationOnce(() => { throw new Error("analytics down"); });
    mocks.withScope.mockImplementationOnce(() => { throw new Error("sentry down"); });

    expect(() => recordFormSubmissionCompletion(completion)).not.toThrow();
    expect(() => captureFormsOperationalError(new Error("database down"), completion)).not.toThrow();
  });
});
