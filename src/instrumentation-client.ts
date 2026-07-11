// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: [/^\//, /^https:\/\/jobing\.site/],
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogToken && process.env.NODE_ENV === "production") {
  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    disable_session_recording: true,
  });
}
