import { Pricing } from "@/components/Pricing";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function PricingPage() {
    const user = await currentUser();
    let currentSubscriptionId = null;

    if (user) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (supabaseUrl && supabaseServiceKey) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
            const { data } = await supabaseAdmin
                .from('users')
                .select('current_subscription_id')
                .eq('id', user.id)
                .single();

            currentSubscriptionId = data?.current_subscription_id;
        }
    }

    return (
        <main className="min-h-screen pt-24 pb-16">
            <Pricing />

            {currentSubscriptionId && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
                    <div className="inline-block p-6 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
                        <p className="text-slate-600 font-medium mb-4">You already have an active subscription.</p>
                        <Link
                            href="/billing"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            Manage Billing
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}
