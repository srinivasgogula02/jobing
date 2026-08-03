import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Pricing } from "@/components/Pricing";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { getUserSubscriptionForUser } from "@/lib/billing-data";
import { DOCS_URL } from "@/lib/app-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | Jobing AI",
  description: "Choose a Jobing AI plan for published web pages, custom forms, customer responses, and AI connector actions.",
  alternates: { canonical: "/pricing" },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "pending", "on_hold"]);

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const { userId } = await auth();
  let currentProductId: string | null = null;

  if (userId) {
    try {
      const subscription = await getUserSubscriptionForUser(userId);
      if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
        currentProductId = subscription.product_id;
      }
    } catch (error) {
      console.error("[pricing] Could not reconcile subscription state", error instanceof Error ? { name: error.name } : { type: typeof error });
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f4]">
      <PublicSiteHeader />
      <Pricing currentProductId={currentProductId} limitSource={from ?? null} />
      <footer className="border-t border-[#e1e4dc] bg-[#f7f8f4] px-4 py-8 text-center text-xs text-[#737a70]">Jobing AI · Secure checkout by Dodo Payments · <a href={DOCS_URL} className="underline">Docs</a> · <a href="/terms" className="underline">Terms</a> · <a href="/privacy" className="underline">Privacy</a></footer>
    </div>
  );
}
