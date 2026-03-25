"use server";

import { currentUser } from "@clerk/nextjs/server";
import { headers, cookies } from "next/headers";
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

        const reqHeaders = await headers();
        const reqCookies = await cookies();
        
        // Safely extract client data; truncate User Agent per metadata safe-limits
        const clientIp = reqHeaders.get('x-forwarded-for')?.split(',')[0] || reqHeaders.get('x-real-ip') || '';
        const userAgent = (reqHeaders.get('user-agent') || '').substring(0, 255);
        const fbp = reqCookies.get('_fbp')?.value || '';
        const fbc = reqCookies.get('_fbc')?.value || '';

        const session = await dodo.checkoutSessions.create({
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1
                }
            ],
            customer: {
                email: primaryEmail?.emailAddress || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
            },
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
            metadata: {
                clerk_user_id: user.id,
                client_ip: clientIp,
                client_user_agent: userAgent,
                fbp,
                fbc
            }
        });

        if (session.checkout_url) {
            return { url: session.checkout_url };
        }

        return { url: null, session };

    } catch (error: any) {
        console.error("Error creating Dodo checkout:", error);
        throw new Error(error.message || "Failed to create checkout session");
    }
}
