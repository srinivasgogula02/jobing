"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // A stable, non-PII user ID makes crash-free user and release adoption
    // metrics meaningful without sending names or email addresses to Sentry.
    Sentry.setUser(user ? { id: user.id } : null);

    const enabled = process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED === "true" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || !enabled) return;
    if (user) {
      // Stable application ID only. Names, usernames, and email addresses are
      // unnecessary for product analytics and are deliberately excluded.
      posthog.identify(user.id);
      identifiedUserId.current = user.id;
    } else if (identifiedUserId.current) {
      // Reset only on a real sign-out. Resetting on the first anonymous load
      // would generate a new anonymous identity on every page refresh.
      posthog.reset();
      identifiedUserId.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return null;
}
