// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
