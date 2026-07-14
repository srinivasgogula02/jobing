import * as Sentry from "@sentry/nextjs";

export const TELEMETRY_SERVICE = "forms";

type TelemetryEnvironment = Readonly<Record<string, string | undefined>>;

export function telemetryEnvironment(env: TelemetryEnvironment = process.env) {
  if (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") {
    return env.VERCEL_ENV;
  }
  if (env.NODE_ENV === "test" || env.NODE_ENV === "development" || env.NODE_ENV === "production") {
    return env.NODE_ENV;
  }
  return "unknown";
}

export function telemetryRelease(env: TelemetryEnvironment = process.env) {
  const candidate = env.SENTRY_RELEASE || env.VERCEL_GIT_COMMIT_SHA;
  if (!candidate || !/^[a-zA-Z0-9._-]{7,80}$/.test(candidate)) return undefined;
  return `${TELEMETRY_SERVICE}@${candidate}`;
}

/** Production is automatic. Preview and local telemetry require an explicit opt-in. */
export function isServerTelemetryEnabled(env: TelemetryEnvironment = process.env) {
  return env.VERCEL_ENV === "production" || env.JOBING_OBSERVABILITY_ENABLED === "true";
}

const SAFE_TAGS = new Set(["service", "environment", "operation", "reason", "status_code"]);

/**
 * Last-line privacy filter for Sentry. Request data and runtime values never leave
 * the service; stack frames are retained so production failures remain actionable.
 */
export function scrubSentryEvent<T extends Sentry.Event>(event: T): T {
  event.request = undefined;
  event.user = undefined;
  event.breadcrumbs = undefined;
  event.extra = undefined;
  event.contexts = undefined;
  event.server_name = undefined;
  event.message = event.message ? "Forms operational error" : undefined;
  event.logentry = undefined;

  if (event.tags) {
    event.tags = Object.fromEntries(Object.entries(event.tags).filter(([key]) => SAFE_TAGS.has(key)));
  }

  for (const value of event.exception?.values ?? []) {
    value.value = "Forms operational error";
    for (const frame of value.stacktrace?.frames ?? []) frame.vars = undefined;
  }

  return event;
}

export function scrubSentryTransaction<T extends Sentry.Event>(event: T): T {
  scrubSentryEvent(event);
  event.transaction = "forms.request";
  event.spans = event.spans?.map((span) => ({ ...span, description: undefined, data: {} }));
  return event;
}

export function initServerSentry() {
  const enabled = isServerTelemetryEnabled() && Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  const environment = telemetryEnvironment();
  const release = telemetryRelease();

  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled,
    environment,
    release,
    tracesSampleRate: enabled ? 0.01 : 0,
    sampleRate: enabled ? 1 : 0,
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    initialScope: {
      tags: { service: TELEMETRY_SERVICE, environment },
    },
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryTransaction,
  });
}
