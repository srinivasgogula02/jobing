import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function isServerTelemetryEnabled(): boolean {
  return process.env.OBSERVABILITY_ENABLED === "true" || process.env.VERCEL_ENV === "production";
}

export function getPostHogClient(): PostHog | null {
  const token = process.env.POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || !isServerTelemetryEnabled()) return null;
  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Vercel functions can freeze immediately after returning; flush each
      // event rather than relying on a process-lifetime batch timer.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
