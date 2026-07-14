// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubMainSentryEvent, scrubMainSentryTransaction } from "./src/lib/sentry-privacy";

const enabled = process.env.OBSERVABILITY_ENABLED === "true" || process.env.VERCEL_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: enabled && Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: enabled ? 0.02 : 0,
  initialScope: { tags: { service: "main" } },
  sendDefaultPii: false,
  beforeSend: scrubMainSentryEvent,
  beforeSendTransaction: scrubMainSentryTransaction,
});
