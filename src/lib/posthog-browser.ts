import type { PostHog } from "posthog-js";

let posthogPromise: Promise<PostHog | null> | null = null;
let loadedClient: PostHog | null = null;

function enabled() {
  return process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED === "true"
    || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

function projectToken() {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
}

function anonymousId() {
  const storageKey = "jobing_analytics_id";
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Load the full PostHog browser SDK only for authenticated product screens,
 * where session replay is useful. Public marketing pages use the tiny capture
 * request below and avoid shipping the replay runtime on their initial load.
 */
export function loadPostHogBrowserClient(): Promise<PostHog | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const token = projectToken();
  if (!token || !enabled()) return Promise.resolve(null);
  if (posthogPromise) return posthogPromise;

  posthogPromise = import("posthog-js").then(({ default: posthog }) => {
    if (!posthog.__loaded) posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      session_recording: {
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
    loadedClient = posthog;
    return posthog;
  }).catch(() => null);
  return posthogPromise;
}

export function getLoadedPostHogBrowserClient() {
  return loadedClient;
}

export function captureLightweightBrowserEvent(
  event: string,
  properties: Record<string, string | number | boolean | undefined>,
  distinctId?: string,
) {
  if (typeof window === "undefined" || !enabled()) return;
  const token = projectToken();
  if (!token) return;

  if (loadedClient) {
    loadedClient.capture(event, properties);
    return;
  }

  const clean = Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
  const body = JSON.stringify({
    api_key: token,
    event,
    properties: {
      ...clean,
      distinct_id: distinctId || anonymousId(),
      token,
      $process_person_profile: false,
    },
  });

  try {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon("/ingest/capture/", new Blob([body], { type: "application/json" }));
      if (queued) return;
    }
    void fetch("/ingest/capture/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    });
  } catch {
    // Analytics must never affect the product.
  }
}
