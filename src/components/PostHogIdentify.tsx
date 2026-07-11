"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      posthog.identify(user.id, {
        username: user.username,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      });
    } else {
      posthog.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  return null;
}
