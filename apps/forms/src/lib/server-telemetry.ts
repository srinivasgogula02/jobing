import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { PostHog } from "posthog-node";
import {
  isServerTelemetryEnabled,
  TELEMETRY_SERVICE,
  telemetryEnvironment,
  telemetryRelease,
} from "@/lib/observability-config";

const OUTCOMES = new Set(["accepted", "rejected", "unavailable"]);
const REASONS = new Set([
  "success",
  "honeypot",
  "request_too_large",
  "form_not_found",
  "invalid_json",
  "invalid_payload",
  "unsupported_media_type",
  "challenge_failed",
  "security_check_unavailable",
  "validation_failed",
  "configuration_missing",
  "rate_limited",
  "origin_not_allowed",
  "form_closed",
  "submission_failed",
  "unhandled_exception",
]);
const RESPONSE_MODES = new Set(["json", "browser"]);
const SOURCES = new Set(["generated_page", "custom_site", "direct"]);
const DURATION_BUCKETS = new Set(["lt_100ms", "100_499ms", "500_999ms", "1_2s", "gte_3s"]);
const STATUS_CODES = new Set([201, 303, 400, 403, 404, 409, 413, 415, 422, 429, 500, 503]);
const INTEGRATION_PROVIDERS = new Set([
  "email",
  "slack",
  "lark",
  "telegram",
  "google_sheets",
  "google_drive",
  "airtable",
  "notion",
  "zapier",
  "webhook",
  "hubspot",
  "mailchimp",
  "google_analytics",
  "facebook_pixel",
]);

export type FormSubmissionTelemetry = {
  outcome: "accepted" | "rejected" | "unavailable";
  reason:
    | "success"
    | "honeypot"
    | "request_too_large"
    | "form_not_found"
    | "invalid_json"
    | "invalid_payload"
    | "unsupported_media_type"
    | "challenge_failed"
    | "security_check_unavailable"
    | "validation_failed"
    | "configuration_missing"
    | "rate_limited"
    | "origin_not_allowed"
    | "form_closed"
    | "submission_failed"
    | "unhandled_exception";
  status_code: 201 | 303 | 400 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 500 | 503;
  response_mode: "json" | "browser";
  source: "generated_page" | "custom_site" | "direct";
  duration_bucket: "lt_100ms" | "100_499ms" | "500_999ms" | "1_2s" | "gte_3s";
};

export function durationBucket(durationMs: number): FormSubmissionTelemetry["duration_bucket"] {
  if (durationMs < 100) return "lt_100ms";
  if (durationMs < 500) return "100_499ms";
  if (durationMs < 1_000) return "500_999ms";
  if (durationMs < 3_000) return "1_2s";
  return "gte_3s";
}

/** Runtime allowlist. Unknown keys and unexpected values are dropped, not coerced. */
export function sanitizeFormSubmissionTelemetry(input: Record<string, unknown>) {
  const safe: Record<string, string | number> = {};
  if (typeof input.outcome === "string" && OUTCOMES.has(input.outcome)) safe.outcome = input.outcome;
  if (typeof input.reason === "string" && REASONS.has(input.reason)) safe.reason = input.reason;
  if (typeof input.status_code === "number" && STATUS_CODES.has(input.status_code)) safe.status_code = input.status_code;
  if (typeof input.response_mode === "string" && RESPONSE_MODES.has(input.response_mode)) safe.response_mode = input.response_mode;
  if (typeof input.source === "string" && SOURCES.has(input.source)) safe.source = input.source;
  if (typeof input.duration_bucket === "string" && DURATION_BUCKETS.has(input.duration_bucket)) safe.duration_bucket = input.duration_bucket;
  return safe;
}

let posthog: PostHog | null = null;

function getPostHog() {
  const token = process.env.POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  if (!posthog) {
    posthog = new PostHog(token, {
      host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 20,
      flushInterval: 250,
      waitUntilDebounceMs: 25,
      waitUntilMaxWaitMs: 100,
      waitUntil: (promise) => {
        try { waitUntil(promise); } catch { void promise.catch(() => undefined); }
      },
      personProfiles: "never",
    });
  }
  return posthog;
}

export function recordFormSubmissionCompletion(metadata: FormSubmissionTelemetry) {
  if (!isServerTelemetryEnabled()) return;
  const client = getPostHog();
  if (!client) return;

  const release = telemetryRelease();
  const properties = {
    service: TELEMETRY_SERVICE,
    environment: telemetryEnvironment(),
    ...(release ? { release } : {}),
    ...sanitizeFormSubmissionTelemetry(metadata),
    $process_person_profile: false,
  };

  try {
    client.capture({
      distinctId: "jobing-forms-server",
      event: "form_submission_completed",
      properties,
      disableGeoip: true,
    });
  } catch {
    // Analytics must never break or delay form submission.
  }
}

export function captureFormsOperationalError(
  error: unknown,
  metadata: FormSubmissionTelemetry,
) {
  if (!isServerTelemetryEnabled() || !(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) return;
  try {
    const safe = sanitizeFormSubmissionTelemetry(metadata);
    Sentry.withScope((scope) => {
      scope.setTag("service", TELEMETRY_SERVICE);
      scope.setTag("operation", "form_submission");
      if (typeof safe.reason === "string") scope.setTag("reason", safe.reason);
      if (typeof safe.status_code === "number") scope.setTag("status_code", String(safe.status_code));
      scope.setContext("operation", safe);
      Sentry.captureException(error);
    });
  } catch {
    // Error reporting is intentionally fail-open.
  }
}

export function captureFormsIntegrationError(
  error: unknown,
  metadata: {
    provider: string;
    code: string;
    attempt: number;
  },
) {
  if (!isServerTelemetryEnabled() || !(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) return;
  const provider = INTEGRATION_PROVIDERS.has(metadata.provider) ? metadata.provider : "unknown";
  const code = /^[a-z0-9_]{1,100}$/u.test(metadata.code) ? metadata.code : "integration_request_failed";
  const attempt = Number.isInteger(metadata.attempt) && metadata.attempt > 0 && metadata.attempt <= 10
    ? metadata.attempt
    : 1;
  try {
    Sentry.withScope((scope) => {
      scope.setTag("service", TELEMETRY_SERVICE);
      scope.setTag("operation", "integration_delivery");
      scope.setTag("provider", provider);
      scope.setTag("error_code", code);
      scope.setContext("integration_delivery", { provider, code, attempt });
      Sentry.captureException(error);
    });
  } catch {
    // Error reporting is intentionally fail-open.
  }
}
