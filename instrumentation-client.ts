import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: [/^\//, /^https:\/\/jobing\.site/],
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token && process.env.NODE_ENV === "production") {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    person_profiles: "identified_only",
    disable_session_recording: true,
  });
}
