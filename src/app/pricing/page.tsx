import type { Metadata } from "next";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { Pricing } from "@/components/Pricing";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
  const user = await currentUser();
  let currentProductId: string | null = null;
  let isActuallyPaid = false;

  if (user) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: userRow } = await supabase
        .from("users")
        .select("current_subscription_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userRow?.current_subscription_id) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, product_id")
          .eq("subscription_id", userRow.current_subscription_id)
          .maybeSingle();
        if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          isActuallyPaid = true;
          currentProductId = subscription.product_id;
        }
      }

      const jwtIsPaid = user.publicMetadata?.is_paid === true;
      if (jwtIsPaid !== isActuallyPaid) {
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            is_paid: isActuallyPaid,
            has_credits: isActuallyPaid || user.publicMetadata?.has_credits === true,
          },
        });
      }
    } catch (error) {
      console.error("[pricing] Could not reconcile subscription state", error instanceof Error ? { name: error.name } : { type: typeof error });
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f4]">
      <PublicSiteHeader />
      <Pricing currentProductId={currentProductId} limitReached={from === "connector-limit"} />
      <footer className="border-t border-[#e1e4dc] bg-[#f7f8f4] px-4 py-8 text-center text-xs text-[#737a70]">Jobing AI · Secure checkout by Dodo Payments · <a href="/terms" className="underline">Terms</a> · <a href="/privacy" className="underline">Privacy</a></footer>
    </div>
  );
}
