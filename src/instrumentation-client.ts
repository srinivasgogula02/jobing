// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
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
