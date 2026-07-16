// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { filterMainClientSentryEvent, scrubMainSentryTransaction } from "@/lib/sentry-privacy";

const observabilityEnabled = process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED === "true"
  || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: observabilityEnabled && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  // Errors are always captured. Keep performance spans intentionally small for
  // the Sentry free tier and reserve quota for actionable product failures.
  tracesSampleRate: observabilityEnabled ? 0.02 : 0,
  tracePropagationTargets: [/^\//, /^https:\/\/jobing\.site/],
  sendDefaultPii: false,
  beforeSend: filterMainClientSentryEvent,
  beforeSendTransaction: scrubMainSentryTransaction,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogToken && observabilityEnabled) {
  posthog.init(posthogToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    session_recording: {
      // Replays are opt-in from the route controller and deliberately show
      // interaction/layout only. Product text and every input value are masked.
      maskAllInputs: true,
      maskTextSelector: "*",
      recordCrossOriginIframes: false,
      recordHeaders: false,
      recordBody: false,
      maskCapturedNetworkRequestFn: (request) => {
        try {
          const url = new URL(request.name, window.location.origin);
          url.search = "";
          url.hash = "";
          return { ...request, name: url.toString() };
        } catch {
          return null;
        }
      },
    },
  });
}
