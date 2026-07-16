import posthog from "posthog-js";

function enabled() {
  return process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED === "true"
    || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

export function getPostHogBrowserClient() {
  if (typeof window === "undefined") return null;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || !enabled()) return null;

  // instrumentation-client and App Router client chunks can run in separate
  // module runtimes. Initialize in the same runtime that captures the event.
  if (!posthog.__loaded) {
    posthog.init(token, {
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
  }
  return posthog;
}
