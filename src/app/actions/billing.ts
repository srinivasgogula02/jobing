"use server";

import { auth } from "@clerk/nextjs/server";
import { dodo } from "@/lib/dodo";
import { getBillingPlanByProductId } from "@/lib/billing-plans";
import { captureProductEvent } from "@/lib/product-telemetry";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getInvoicesForUser, getUserSubscriptionForUser } from "@/lib/billing-data";

function providerErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

// ---------------------
// Get user subscription + profile
// ---------------------
export async function getUserSubscription() {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in" };
    return { success: true as const, data: { subscription: await getUserSubscriptionForUser(userId) } };
}

// ---------------------
// Get invoices (payments)
// ---------------------
export async function getInvoices() {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in" };
    return { success: true as const, data: await getInvoicesForUser(userId) };
}

// ---------------------
// Cancel subscription (set cancel at next billing date)
// ---------------------
export async function cancelSubscription(subscriptionId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in" };

    const supabase = getSupabaseAdmin();
    // Verify subscription ownership
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('subscription_id', subscriptionId).single();
    if (!sub || sub.user_id !== userId) {
        return { success: false as const, error: "Forbidden: You do not own this subscription." };
    }

    try {
        await dodo.subscriptions.update(subscriptionId, {
            cancel_at_next_billing_date: true,
        });

        const supabase = getSupabaseAdmin();
        await supabase
            .from('subscriptions')
            .update({ cancel_at_next_billing_date: true })
            .eq('subscription_id', subscriptionId);

        captureProductEvent({ event: 'subscription_cancelled', distinctId: userId, properties: { product_area: 'billing', source: 'dashboard', status: 'scheduled', outcome: 'success' } });

        return { success: true as const };
    } catch (error: unknown) {
        return {
            success: false as const,
            error: providerErrorMessage(error, "Failed to cancel subscription")
        };
    }
}

// ---------------------
// Restore subscription (undo cancel)
// ---------------------
export async function restoreSubscription(subscriptionId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in" };

    const supabase = getSupabaseAdmin();
    // Verify subscription ownership
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('subscription_id', subscriptionId).single();
    if (!sub || sub.user_id !== userId) {
        return { success: false as const, error: "Forbidden: You do not own this subscription." };
    }

    try {
        await dodo.subscriptions.update(subscriptionId, {
            cancel_at_next_billing_date: false,
        });

        const supabase = getSupabaseAdmin();
        await supabase
            .from('subscriptions')
            .update({ cancel_at_next_billing_date: false })
            .eq('subscription_id', subscriptionId);

        return { success: true as const };
    } catch (error: unknown) {
        return {
            success: false as const,
            error: providerErrorMessage(error, "Failed to restore subscription")
        };
    }
}

// ---------------------
// Change plan
// ---------------------
export async function changePlan(subscriptionId: string, newProductId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in" };

    const newPlan = getBillingPlanByProductId(newProductId);
    if (!newPlan) return { success: false as const, error: "That plan is not available." };

    const supabase = getSupabaseAdmin();
    // Verify subscription ownership
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('subscription_id', subscriptionId).single();
    if (!sub || sub.user_id !== userId) {
        return { success: false as const, error: "Forbidden: You do not own this subscription." };
    }

    try {
        await dodo.subscriptions.changePlan(subscriptionId, {
            product_id: newPlan.productId,
            proration_billing_mode: "prorated_immediately",
            quantity: 1,
        });

        return { success: true as const };
    } catch (error: unknown) {
        return {
            success: false as const,
            error: providerErrorMessage(error, "Failed to change plan")
        };
    }
}
