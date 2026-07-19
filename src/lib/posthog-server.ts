import { PostHog } from "posthog-node";
import { waitUntil } from "@vercel/functions";

let posthogClient: PostHog | null = null;
let posthogMcpClient: PostHog | null = null;

export function isServerTelemetryEnabled(): boolean {
  return process.env.OBSERVABILITY_ENABLED === "true" || process.env.VERCEL_ENV === "production";
}

function createPostHogClient(): PostHog | null {
  const token = process.env.POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || !isServerTelemetryEnabled()) return null;
  return new PostHog(token, {
    host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    // Several connector events are emitted by one request. Let the SDK batch
    // them into one outbound call while waitUntil keeps delivery reliable in
    // Vercel's serverless lifecycle.
    flushAt: 20,
    flushInterval: 250,
    waitUntilDebounceMs: 25,
    waitUntilMaxWaitMs: 100,
    waitUntil: (promise) => {
      try {
        waitUntil(promise);
      } catch {
        void promise.catch(() => undefined);
      }
    },
  });
}

export function getPostHogClient(): PostHog | null {
  if (!posthogClient) posthogClient = createPostHogClient();
  return posthogClient;
}

export function getPostHogMcpClient(): PostHog | null {
  // @posthog/mcp assigns MCP-specific library metadata at the client level, so
  // it must not share the general product-analytics client.
  if (!posthogMcpClient) posthogMcpClient = createPostHogClient();
  return posthogMcpClient;
}
