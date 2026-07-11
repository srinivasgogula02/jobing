"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
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

  return null;
}
