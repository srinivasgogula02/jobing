"use server";

import { currentUser } from "@clerk/nextjs/server";
import { dodo } from "@/lib/dodo";
import { createClient } from "@supabase/supabase-js";

export async function createSubscriptionCheckout(productId: string) {
    const user = await currentUser();

    if (!user) {
        throw new Error("You must be logged in to subscribe.");
    }

    // Prevent duplicate subscription: check if user already has an active subscription
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userRow } = await supabase
            .from('users')
            .select('current_subscription_id')
            .eq('id', user.id)
            .single();

        if (userRow?.current_subscription_id) {
            // Check if existing subscription is still active
            const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('status, product_id')
                .eq('subscription_id', userRow.current_subscription_id)
                .single();

            if (existingSub && (existingSub.status === 'active' || existingSub.status === 'pending')) {
                return { url: null, error: "You already have an active subscription. Manage it from your billing page." };
            }
        }
    }

    try {
        const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);

        const session = await dodo.subscriptions.create({
            billing: {
                city: '',
                country: 'US',
                state: '',
                street: '',
                zipcode: '',
            },
            customer: {
                email: primaryEmail?.emailAddress || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
            },
            product_id: productId,
            quantity: 1,
            payment_link: true,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
            metadata: {
                clerk_user_id: user.id
            }
        });

        if (session.payment_link) {
            return { url: session.payment_link };
        }

        return { url: null, session };

    } catch (error: any) {
        console.error("Error creating Dodo checkout:", error);
        throw new Error(error.message || "Failed to create checkout session");
    }
}
