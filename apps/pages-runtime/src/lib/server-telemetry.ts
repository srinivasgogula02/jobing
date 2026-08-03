import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { PostHog } from "posthog-node";
import {
  isServerTelemetryEnabled,
  TELEMETRY_SERVICE,
  telemetryEnvironment,
  telemetryRelease,
} from "@/lib/observability-config";

const OUTCOMES = new Set(["served", "not_found", "unavailable"]);
const REASONS = new Set(["published", "invalid_address", "unpublished", "load_failed"]);
const ROUTE_MODES = new Set(["subdomain", "path", "custom_domain", "unknown"]);
const DURATION_BUCKETS = new Set(["lt_100ms", "100_499ms", "500_999ms", "1_2s", "gte_3s"]);
const STATUS_CODES = new Set([200, 304, 404, 503]);
export const SUCCESS_SAMPLE_RATE = 0.1;

export type PageRequestTelemetry = {
  outcome: "served" | "not_found" | "unavailable";
  reason: "published" | "invalid_address" | "unpublished" | "load_failed";
  status_code: 200 | 304 | 404 | 503;
  route_mode: "subdomain" | "path" | "custom_domain" | "unknown";
  duration_bucket: "lt_100ms" | "100_499ms" | "500_999ms" | "1_2s" | "gte_3s";
};

export function durationBucket(durationMs: number): PageRequestTelemetry["duration_bucket"] {
  if (durationMs < 100) return "lt_100ms";
  if (durationMs < 500) return "100_499ms";
  if (durationMs < 1_000) return "500_999ms";
  if (durationMs < 3_000) return "1_2s";
  return "gte_3s";
}

/** Runtime allowlist. Hostnames, paths, page IDs, HTML, and unknown keys are dropped. */
export function sanitizePageRequestTelemetry(input: Record<string, unknown>) {
  const safe: Record<string, string | number> = {};
  if (typeof input.outcome === "string" && OUTCOMES.has(input.outcome)) safe.outcome = input.outcome;
  if (typeof input.reason === "string" && REASONS.has(input.reason)) safe.reason = input.reason;
  if (typeof input.status_code === "number" && STATUS_CODES.has(input.status_code)) safe.status_code = input.status_code;
  if (typeof input.route_mode === "string" && ROUTE_MODES.has(input.route_mode)) safe.route_mode = input.route_mode;
  if (typeof input.duration_bucket === "string" && DURATION_BUCKETS.has(input.duration_bucket)) safe.duration_bucket = input.duration_bucket;
  return safe;
}

/** Keep every failure, but cap high-volume successful page serves for free-tier quotas. */
export function shouldRecordPageRequest(
  metadata: Pick<PageRequestTelemetry, "status_code">,
  random: () => number = Math.random,
) {
  return metadata.status_code >= 400 || random() < SUCCESS_SAMPLE_RATE;
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

export function recordPageRequestCompletion(metadata: PageRequestTelemetry) {
  if (!isServerTelemetryEnabled()) return;
  if (!shouldRecordPageRequest(metadata)) return;
  const client = getPostHog();
  if (!client) return;

  const release = telemetryRelease();
  const properties = {
    service: TELEMETRY_SERVICE,
    environment: telemetryEnvironment(),
    ...(release ? { release } : {}),
    ...sanitizePageRequestTelemetry(metadata),
    sampling_rate: metadata.status_code < 400 ? SUCCESS_SAMPLE_RATE : 1,
    $process_person_profile: false,
  };

  try {
    client.capture({
      distinctId: "jobing-pages-runtime-server",
      event: "generated_page_request_completed",
      properties,
      disableGeoip: true,
    });
  } catch {
    // Analytics must never break or delay a page response.
  }
}

export function capturePagesOperationalError(error: unknown, metadata: PageRequestTelemetry) {
  if (!isServerTelemetryEnabled() || !(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) return;
  try {
    const safe = sanitizePageRequestTelemetry(metadata);
    Sentry.withScope((scope) => {
      scope.setTag("service", TELEMETRY_SERVICE);
      scope.setTag("operation", "generated_page_request");
      if (typeof safe.reason === "string") scope.setTag("reason", safe.reason);
      if (typeof safe.status_code === "number") scope.setTag("status_code", String(safe.status_code));
      scope.setContext("operation", safe);
      Sentry.captureException(error);
    });
  } catch {
    // Error reporting is intentionally fail-open.
  }
}
