"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { classifyProductPage } from "@/lib/product-analytics-contract";
import {
  captureLightweightBrowserEvent,
  getLoadedPostHogBrowserClient,
  loadPostHogBrowserClient,
} from "@/lib/posthog-browser";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const pathname = usePathname();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // A stable, non-PII user ID makes crash-free user and release adoption
    // metrics meaningful without sending names or email addresses to Sentry.
    Sentry.setUser(userId ? { id: userId } : null);

    if (!userId && identifiedUserId.current) {
      // Reset only on a real sign-out. Resetting on the first anonymous load
      // would generate a new anonymous identity on every page refresh.
      getLoadedPostHogBrowserClient()?.reset();
      identifiedUserId.current = null;
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded || !pathname) return;
    const page = classifyProductPage(pathname);
    const properties = {
      page_name: page.pageName,
      product_area: page.productArea,
      authenticated: Boolean(userId),
      $process_person_profile: false,
    };

    // Keep the free replay allowance focused on authenticated product screens.
    // PostHog's project-side sampling and billing cap are still respected.
    if (userId && page.replayEligible) {
      void loadPostHogBrowserClient().then((posthog) => {
        if (!posthog) return;
        posthog.identify(userId);
        identifiedUserId.current = userId;
        posthog.capture("product_page_viewed", properties);
        posthog.startSessionRecording();
      });
    } else {
      getLoadedPostHogBrowserClient()?.stopSessionRecording();
      captureLightweightBrowserEvent("product_page_viewed", properties, userId);
    }
  }, [isLoaded, pathname, userId]);

  return null;
}
