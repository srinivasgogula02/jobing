/**
 * Lightweight, typed analytics dispatcher.
 *
 * Why this exists: until now the only events GA4 received were the auto-captured
 * Enhanced Measurement ones (page_view, scroll, etc.) plus DodoPayments' ecommerce
 * hits. The core product loop — someone creating and sharing a note — was invisible.
 * That made the real funnel (the viral /c/ + /copy surface) impossible to measure.
 *
 * `track()` fans a single semantic event out to GA4 (gtag) and the Meta pixel (fbq)
 * if they are present. It is a no-op on the server and on localhost, so local dev
 * traffic no longer pollutes production analytics (we were seeing 127.0.0.1 referrals
 * in the reports).
 */

type EventParams = Record<string, string | number | boolean | undefined>;

// The events that describe the loop we actually care about. Keeping them as a union
// keeps call sites honest and the GA4 event list clean (no typo'd duplicates).
export type AnalyticsEvent =
  | "note_share_created" // a new /c/ note was committed to the server (the viral seed)
  | "note_link_copied" // public /c/ link copied to clipboard (the share action)
  | "note_private_link_copied" // /p/ stealth link copied
  | "note_content_copied" // raw text copied out of a note (consumption)
  | "note_custom_id_set" // user picked a memorable custom slug
  | "note_edited" // an existing note was updated
  | "note_ai_explain" // opened the note content in ChatGPT to explain it
  | "blog_shared" // shared a blog post via a share button
  | "tool_cta_click" // clicked a cross-sell/CTA out of a tool surface
  | "install_prompt_shown" // PWA add-to-home-screen surfaced
  | "install_accepted" // PWA installed
  | "feedback_started" // user picked a sentiment on the feedback page (intent)
  | "feedback_submitted"; // a feedback message was successfully sent

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isLocalhost(): boolean {
  if (!isBrowser()) return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local") || h.startsWith("172.") || h.startsWith("192.168.");
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEvent, params: EventParams = {}): void {
  if (!isBrowser()) return;

  // PostHog receives events in all environments (it handles debug/dev suppression internally).
  try {
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture(event, params);
    });
  } catch {
    /* analytics must never break the product */
  }

  if (isLocalhost()) return;

  // Strip undefined values so GA4 doesn't record empty params.
  const clean: EventParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) clean[k] = v;
  }

  try {
    window.gtag?.("event", event, clean);
  } catch {
    /* analytics must never break the product */
  }

  // Mirror the most meaningful conversion-shaped events to the Meta pixel so the
  // ad audiences/retargeting reflect real usage, not just page views.
  try {
    if (event === "note_share_created") {
      window.fbq?.("trackCustom", "NoteShareCreated", clean);
    } else if (event === "tool_cta_click") {
      window.fbq?.("trackCustom", "ToolCTAClick", clean);
    }
  } catch {
    /* no-op */
  }
}
