"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { isSensitiveReplayPath } from "@/lib/posthog-replay";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // A stable, non-PII user ID makes crash-free user and release adoption
    // metrics meaningful without sending names or email addresses to Sentry.
    Sentry.setUser(user ? { id: user.id } : null);

    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NODE_ENV !== "production") return;
    if (user) {
      posthog.identify(user.id, {
        username: user.username,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      });
      identifiedUserId.current = user.id;
    } else if (identifiedUserId.current) {
      // Reset only on a real sign-out. Resetting on the first anonymous load
      // would generate a new anonymous identity on every page refresh.
      posthog.reset();
      identifiedUserId.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NODE_ENV !== "production") return;

    // Do not force-start: PostHog's remote sample rate remains authoritative.
    // Private-link pages stop an active replay for the rest of this page lifecycle.
    if (isSensitiveReplayPath(pathname)) posthog.stopSessionRecording();
  }, [pathname]);

  return null;
}
