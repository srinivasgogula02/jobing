"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { dodo } from "@/lib/dodo";

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');
    return createClient(supabaseUrl, supabaseServiceKey);
}

// ---------------------
// Get user subscription + profile
// ---------------------
export async function getUserSubscription() {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };

    const supabase = getSupabaseAdmin();

    const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id, credits, current_subscription_id, dodo_customer_id')
        .eq('id', user.id)
        .single();

    if (userErr || !userRow) {
        return { success: true as const, data: { subscription: null, user: null } };
    }

    let subscription = null;
    if (userRow.current_subscription_id) {
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscription_id', userRow.current_subscription_id)
            .single();
        subscription = sub;
    }

    return {
        success: true as const,
        data: { subscription, user: userRow },
    };
}

// ---------------------
// Get invoices (payments)
// ---------------------
export async function getInvoices() {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };

    const supabase = getSupabaseAdmin();

    const { data: userRow } = await supabase
        .from('users')
        .select('dodo_customer_id')
        .eq('id', user.id)
        .single();

    if (!userRow?.dodo_customer_id) {
        return { success: true as const, data: [] };
    }

    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', userRow.dodo_customer_id)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false as const, error: "Failed to load invoices" };
    }

    return { success: true as const, data: payments || [] };
}

// ---------------------
// Cancel subscription (set cancel at next billing date)
// ---------------------
export async function cancelSubscription(subscriptionId: string) {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };

    try {
        await dodo.subscriptions.update(subscriptionId, {
            cancel_at_next_billing_date: true,
        });

        const supabase = getSupabaseAdmin();
        await supabase
            .from('subscriptions')
            .update({ cancel_at_next_billing_date: true })
            .eq('subscription_id', subscriptionId);

        return { success: true as const };
    } catch (error: any) {
        return {
            success: false as const,
            error: error.message || "Failed to cancel subscription"
        };
    }
}

// ---------------------
// Restore subscription (undo cancel)
// ---------------------
export async function restoreSubscription(subscriptionId: string) {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };

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
    } catch (error: any) {
        return {
            success: false as const,
            error: error.message || "Failed to restore subscription"
        };
    }
}

// ---------------------
// Change plan
// ---------------------
export async function changePlan(subscriptionId: string, newProductId: string) {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };

    try {
        await dodo.subscriptions.changePlan(subscriptionId, {
            product_id: newProductId,
            proration_billing_mode: "prorated_immediately",
            quantity: 1,
        });

        return { success: true as const };
    } catch (error: any) {
        return {
            success: false as const,
            error: error.message || "Failed to change plan"
        };
    }
}
