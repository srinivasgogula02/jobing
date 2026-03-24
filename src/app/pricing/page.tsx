import { Pricing } from "@/components/Pricing";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Header } from "@/components/Header";
import { redirect } from "next/navigation";

export default async function PricingPage() {
    const user = await currentUser();
    let currentSubscriptionId = null;
    let isActuallyPaid = false;

    if (user) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (supabaseUrl && supabaseServiceKey) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
            
            // 1. Fetch current subscription ID
            const { data: userRow } = await supabaseAdmin
                .from('users')
                .select('current_subscription_id')
                .eq('id', user.id)
                .single();

            currentSubscriptionId = userRow?.current_subscription_id;

            // 2. If they have a subscription, verify if it's currently active in the DB
            if (currentSubscriptionId) {
                const { data: subData } = await supabaseAdmin
                    .from('subscriptions')
                    .select('status')
                    .eq('subscription_id', currentSubscriptionId)
                    .single();

                if (subData && (subData.status === 'active' || subData.status === 'pending')) {
                    isActuallyPaid = true;
                }
            }

            // 3. AUTO-SYNC & HEAL CLERK JWT METADATA
            const jwtIsPaid = user.publicMetadata?.is_paid === true;

            if (isActuallyPaid && !jwtIsPaid) {
                // Desert Case / Legacy User: They are paid in DB, but Clerk JWT is missing the flag.
                // The proxy forced them here. Let's fix their Clerk account permanently and seamlessly let them in.
                try {
                    const client = await clerkClient();
                    await client.users.updateUserMetadata(user.id, {
                        publicMetadata: { is_paid: true }
                    });
                    console.log(`[Auto-Sync] Backfilled is_paid=true for legacy user ${user.id}`);
                    redirect('/create'); // Get them off the pricing page!
                } catch (err) {
                    console.error("[Auto-Sync] Error syncing is_paid=true to Clerk:", err);
                }
            } else if (!isActuallyPaid && jwtIsPaid) {
                // Edge Case: Their subscription expired in DB, but Clerk JWT still says paid.
                // Fix it so they can't bypass the proxy later if JWT was somehow stalled.
                try {
                    const client = await clerkClient();
                    await client.users.updateUserMetadata(user.id, {
                        publicMetadata: { is_paid: false }
                    });
                    console.log(`[Auto-Sync] Removed is_paid flag for expired user ${user.id}`);
                } catch (err) {
                    console.error("[Auto-Sync] Error stripping is_paid from Clerk:", err);
                }
            }
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#fafafa]">
            <Header />
            <main className="flex-1 pt-12 pb-16">
                <Pricing />

                {currentSubscriptionId && (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
                        <div className="inline-block p-6 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm">
                            <p className="text-[#6b7280] font-medium mb-4">You already have an active subscription.</p>
                            <Link
                                href="/billing"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#333333] text-white font-bold rounded-xl transition-colors text-sm"
                            >
                                Manage Billing
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
