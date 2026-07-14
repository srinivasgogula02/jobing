import { headers } from 'next/headers';
import { Webhook } from 'standardwebhooks';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';
import { sendMetaPurchaseEvent } from '@/lib/metaCAPI';
import { getPostHogClient } from '@/lib/posthog-server';
import crypto from 'node:crypto';
import { syncFormsWorkspaceProjection } from '@/lib/forms-service';
import { buildFormsSubscriptionProjection, subscriptionAccessState, type SubscriptionAccessState } from '@/lib/subscription-entitlements';
import { getBillingPlanByProductId } from '@/lib/billing-plans';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add DODO_WEBHOOK_SECRET to .env.local');
    }

    // Get the headers from Dodo Payments
    const headerPayload = await headers();
    const webhookHeaders = {
        'webhook-id': headerPayload.get('webhook-id') || '',
        'webhook-signature': headerPayload.get('webhook-signature') || '',
        'webhook-timestamp': headerPayload.get('webhook-timestamp') || '',
    };

    // If there are no signature headers, error out
    if (!webhookHeaders['webhook-id'] || !webhookHeaders['webhook-timestamp'] || !webhookHeaders['webhook-signature']) {
        return new Response('Error occurred -- missing Dodo headers', { status: 400 });
    }

    // Get the body
    const body = await req.text();
    const eventKey = crypto.createHash('sha256').update(body).digest('hex').slice(0, 32);
    let payload: any;
    try {
        payload = JSON.parse(body);
    } catch (e) {
        return new Response('Error parsing JSON body', { status: 400 });
    }

    // Initialize Standard Webhook
    const wh = new Webhook(WEBHOOK_SECRET);

    // Verify the payload with the headers
    try {
        wh.verify(body, webhookHeaders);
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Invalid webhook signature', { status: 400 });
    }

    const event = payload;
    console.info(`[Dodo Webhook] Received ${event.type} event`);

    try {
        switch (event.type) {
            // Subscription events
            case "subscription.active":
            case "subscription.plan_changed":
            case "subscription.renewed": {
                await manageSubscription(event);
                const userId = await updateSubscriptionTierAndCredits({
                    dodoCustomerId: event.data.customer.customer_id,
                    subscriptionId: event.data.subscription_id,
                    accessState: "active",
                    clerkUserId: event.data.metadata?.clerk_user_id || null,
                    productId: event.data.product_id,
                });
                await syncSubscriptionFormsEntitlement(event, eventKey, userId, "active");
                const posthog = getPostHogClient();
                const activatedDistinctId = event.data.metadata?.clerk_user_id || event.data.customer.customer_id;
                const activatedPlan = getBillingPlanByProductId(event.data.product_id);
                await posthog?.captureImmediate({
                    distinctId: activatedDistinctId,
                    event: 'subscription_activated',
                    properties: {
                        plan: activatedPlan?.key || 'unknown',
                        event_type: event.type,
                        currency: event.data.currency,
                    },
                }).catch((analyticsError) => console.error('PostHog capture failed:', analyticsError));
                break;
            }

            case "subscription.on_hold": {
                await manageSubscription(event);
                const userId = await updateSubscriptionTierAndCredits({
                    dodoCustomerId: event.data.customer.customer_id,
                    subscriptionId: event.data.subscription_id,
                    accessState: "grace",
                    clerkUserId: event.data.metadata?.clerk_user_id || null,
                    productId: event.data.product_id,
                });
                await syncSubscriptionFormsEntitlement(event, eventKey, userId, "grace");
                break;
            }

            case "subscription.cancelled":
            case "subscription.expired":
            case "subscription.failed": {
                await manageSubscription(event);
                const userId = await updateSubscriptionTierAndCredits({
                    dodoCustomerId: event.data.customer.customer_id,
                    subscriptionId: null,
                    accessState: "inactive",
                    clerkUserId: event.data.metadata?.clerk_user_id || null,
                });
                await syncSubscriptionFormsEntitlement(event, eventKey, userId, "inactive");
                const posthog = getPostHogClient();
                const cancelledDistinctId = event.data.metadata?.clerk_user_id || event.data.customer.customer_id;
                await posthog?.captureImmediate({
                    distinctId: cancelledDistinctId,
                    event: 'subscription_cancelled',
                    properties: {
                        event_type: event.type,
                        currency: event.data.currency,
                    },
                }).catch((analyticsError) => console.error('PostHog capture failed:', analyticsError));
                break;
            }

            // Payment events
            case "payment.succeeded": {
                await managePayment(event);
                sendMetaPurchaseEvent(event.data).catch(console.error);
                const posthog = getPostHogClient();
                const paymentDistinctId = event.data.metadata?.clerk_user_id || event.data.customer.customer_id;
                await posthog?.captureImmediate({
                    distinctId: paymentDistinctId,
                    event: 'payment_succeeded',
                    properties: {
                        currency: event.data.currency,
                        outcome: 'succeeded',
                    },
                }).catch((analyticsError) => console.error('PostHog capture failed:', analyticsError));
                break;
            }

            case "payment.failed":
            case "payment.processing":
            case "payment.cancelled":
                await managePayment(event);
                break;

            default:
                console.warn(`[Dodo Webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error: any) {
        console.error("[Dodo Webhook] Error processing webhook:", error.message);
        return new Response("Error processing webhook", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Helpers

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase Environment Variables');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

async function manageSubscription(event: any) {
    const supabase = getSupabaseAdmin();

    // Resolve the user_id (Clerk ID) from metadata passed during checkout
    const clerkUserId = event.data.metadata?.clerk_user_id || null;

    // Map the Dodo event data to the database schema
    const data: Record<string, any> = {
        subscription_id: event.data.subscription_id,
        addons: event.data.addons,
        billing: event.data.billing,
        cancel_at_next_billing_date: event.data.cancel_at_next_billing_date,
        cancelled_at: event.data.cancelled_at,
        created_at: event.data.created_at,
        currency: event.data.currency,
        customer_email: event.data.customer.email,
        customer_name: event.data.customer.name,
        customer_id: event.data.customer.customer_id,
        discount_id: event.data.discount_id,
        metadata: event.data.metadata,
        next_billing_date: event.data.next_billing_date,
        on_demand: event.data.on_demand,
        payment_frequency_count: event.data.payment_frequency_count,
        payment_period_interval: event.data.payment_frequency_interval,
        previous_billing_date: event.data.previous_billing_date,
        product_id: event.data.product_id,
        quantity: event.data.quantity,
        recurring_pre_tax_amount: event.data.recurring_pre_tax_amount,
        status: event.data.status,
        subscription_period_count: event.data.subscription_period_count,
        subscription_period_interval: event.data.subscription_period_interval,
        tax_inclusive: event.data.tax_inclusive,
        trial_period_days: event.data.trial_period_days,
    };

    // Link subscription to the user via user_id FK (Clerk ID from metadata)
    if (clerkUserId) {
        data.user_id = clerkUserId;
    }

    const { error } = await supabase.from("subscriptions").upsert(data, {
        onConflict: "subscription_id",
    });

    if (error) {
        console.error("[manageSubscription] DB error:", error);
        throw error;
    }
    console.log(`[manageSubscription] Upserted subscription ${data.subscription_id}.`);
}

async function managePayment(event: any) {
    const supabase = getSupabaseAdmin();

    const data = {
        payment_id: event.data.payment_id,
        brand_id: event.data.brand_id,
        created_at: event.data.created_at,
        currency: event.data.currency,
        metadata: event.data.metadata,
        payment_method: event.data.payment_method,
        payment_method_type: event.data.payment_method_type,
        status: event.data.status,
        subscription_id: event.data.subscription_id,
        total_amount: event.data.total_amount,
        customer_email: event.data.customer.email,
        customer_name: event.data.customer.name,
        customer_id: event.data.customer.customer_id,
        webhook_data: event,
        billing: event.data.billing,
        business_id: event.data.business_id,
        card_issuing_country: event.data.card_issuing_country,
        card_last_four: event.data.card_last_four,
        card_network: event.data.card_network,
        card_type: event.data.card_type,
        discount_id: event.data.discount_id,
        disputes: event.data.disputes,
        error_code: event.data.error_code,
        error_message: event.data.error_message,
        payment_link: event.data.payment_link,
        product_cart: event.data.product_cart,
        refunds: event.data.refunds,
        settlement_amount: event.data.settlement_amount,
        settlement_currency: event.data.settlement_currency,
        settlement_tax: event.data.settlement_tax,
        tax: event.data.tax,
        updated_at: event.data.updated_at,
    };

    const { error } = await supabase.from("payments").upsert(data, {
        onConflict: "payment_id",
    });

    if (error) {
        console.error("[managePayment] DB error:", error);
        throw error;
    }
    console.log(`[managePayment] Upserted payment ${data.payment_id}.`);
}


/**
 * Updates the user's active subscription ID and allocates credits.
 * Uses clerk_user_id from webhook metadata to find the user.
 * Falls back to dodo_customer_id lookup if metadata is missing.
 */
async function updateSubscriptionTierAndCredits(props: {
    dodoCustomerId: string;
    subscriptionId: string | null;
    accessState: SubscriptionAccessState;
    clerkUserId?: string | null;
    productId?: string;
}) {
    const supabase = getSupabaseAdmin();

    let user: any = null;
    let fetchError: any = null;

    // Try finding the user by clerk_user_id first (from checkout metadata)
    if (props.clerkUserId) {
        const result = await supabase
            .from("users")
            .select("id, credits, current_subscription_id, dodo_customer_id")
            .eq("id", props.clerkUserId)
            .single();
        user = result.data;
        fetchError = result.error;
    }

    // Fallback: try finding by dodo_customer_id
    if (!user && props.dodoCustomerId) {
        const result = await supabase
            .from("users")
            .select("id, credits, current_subscription_id, dodo_customer_id")
            .eq("dodo_customer_id", props.dodoCustomerId)
            .single();
        user = result.data;
        fetchError = result.error;
    }

    if (!user) {
        console.warn(`[updateSubscriptionTier] User not found for Clerk ID ${props.clerkUserId} or Dodo Customer ${props.dodoCustomerId}.`);
        throw new Error('Subscription user could not be resolved.');
    }

    const retainsAccess = props.accessState === 'active' || props.accessState === 'grace';
    const updates: any = {
        current_subscription_id: retainsAccess ? props.subscriptionId : null,
    };

    // Store dodo_customer_id on user if not already set
    if (!user.dodo_customer_id && props.dodoCustomerId) {
        updates.dodo_customer_id = props.dodoCustomerId;
    }

    // Allocate credits when subscription becomes active or renews
    if (props.accessState === 'active') {
        let addedCredits = 0;
        if (props.productId === process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO) {
            addedCredits = 50;
        } else if (props.productId === process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE) {
            addedCredits = 150;
        }

        if (addedCredits > 0) {
            // This is a period allowance, not a balance increment. Assigning the
            // allowance makes webhook retries and duplicate deliveries idempotent.
            updates.credits = addedCredits;
            console.log(`[updateSubscriptionTier] Set ${addedCredits} credits for user ${user.id}.`);
        } else {
            console.warn(`[updateSubscriptionTier] Unknown product ID ${props.productId}, allocating 0 credits.`);
        }
    }

    const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

    if (updateError) {
        console.error("[updateSubscriptionTier] Error updating user:", updateError);
        throw updateError;
    }

    // Sync is_paid status to Clerk publicMetadata
    const clerkUserId = props.clerkUserId || user.id;
    if (clerkUserId) {
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(clerkUserId);
            await client.users.updateUserMetadata(clerkUserId, {
                publicMetadata: {
                    ...clerkUser.publicMetadata,
                    is_paid: retainsAccess,
                    has_credits: retainsAccess,
                }
            });
            console.log(`[updateSubscriptionTier] Synced subscription access to Clerk for ${clerkUserId}.`);
        } catch (clerkErr) {
            console.error(`[updateSubscriptionTier] Error syncing to Clerk:`, clerkErr);
        }
    }

    console.log(`[updateSubscriptionTier] User tier updated successfully for ${user.id}.`);
    return user.id as string;
}

async function syncSubscriptionFormsEntitlement(
    event: any,
    eventKey: string,
    userId: string,
    accessState: SubscriptionAccessState,
) {
    const classified = subscriptionAccessState(event.type);
    if (classified !== accessState) throw new Error('Subscription event classification mismatch.');
    const eventTimestamp = event.data.updated_at || event.data.created_at || event.created_at;
    const projection = buildFormsSubscriptionProjection({
        userId,
        productId: accessState === 'inactive' ? null : event.data.product_id,
        accessState,
        eventKey,
        eventTimestamp,
        eventType: event.type,
    });
    await syncFormsWorkspaceProjection(projection);
}
