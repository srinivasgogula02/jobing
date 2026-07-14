"use server";

import crypto from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";
import { dodo } from "@/lib/dodo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getBillingPlanByProductId } from "@/lib/billing-plans";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "pending", "on_hold"]);

export async function createSubscriptionCheckout(productId: string, attemptId: string) {
  const user = await currentUser();
  if (!user) return { url: null, error: "Sign in before choosing a plan." };

  const plan = getBillingPlanByProductId(productId);
  if (!plan) return { url: null, error: "That plan is not available." };
  if (!UUID_PATTERN.test(attemptId)) return { url: null, error: "Checkout could not be started. Refresh and try again." };

  const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress;
  if (!primaryEmail) return { url: null, error: "Add a primary email address to your account before checkout." };

  try {
    const supabase = getSupabaseAdmin();
    const { data: userRow } = await supabase
      .from("users")
      .select("current_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow?.current_subscription_id) {
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("subscription_id", userRow.current_subscription_id)
        .maybeSingle();
      if (existingSubscription && ACTIVE_SUBSCRIPTION_STATUSES.has(existingSubscription.status)) {
        return { url: null, error: "You already have an active subscription. Manage it from Billing." };
      }
    }

    const session = await dodo.checkoutSessions.create(
      {
        product_cart: [{ product_id: plan.productId, quantity: 1 }],
        customer: {
          email: primaryEmail,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Jobing AI customer",
        },
        return_url: `${(process.env.NEXT_PUBLIC_APP_URL || "https://jobing.site").replace(/\/$/, "")}/dashboard?checkout=returned`,
        minimal_address: true,
        customization: {
          theme: "light",
          show_order_details: true,
        },
        feature_flags: {
          allow_currency_selection: true,
          allow_discount_code: true,
          allow_phone_number_collection: false,
          redirect_immediately: true,
        },
        metadata: {
          clerk_user_id: user.id,
          jobing_plan: plan.key,
        },
      },
      {
        idempotencyKey: crypto.createHash("sha256").update(`${user.id}:${plan.key}:${attemptId}`).digest("hex"),
      },
    );

    if (!session.checkout_url) return { url: null, error: "Checkout did not return a secure payment URL." };
    return { url: session.checkout_url, error: null };
  } catch (error) {
    console.error("[checkout] Dodo session creation failed", error instanceof Error ? { name: error.name } : { type: typeof error });
    return { url: null, error: "Checkout is temporarily unavailable. Try again in a moment." };
  }
}
