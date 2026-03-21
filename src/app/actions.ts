"use server"

import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function updateBio(newBio: string) {
    const user = await currentUser();

    if (!user || (!user.username)) {
        throw new Error("You must be logged in with a valid username to update your bio.");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server is missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update the user's bio in Supabase
    const { error } = await supabaseAdmin
        .from('users')
        .update({ bio: newBio })
        .eq('id', user.id); // Securely restrict to the logged in user

    if (error) {
        console.error("Error updating bio:", error);
        throw new Error(`Failed to update bio: ${error.message}`);
    }

    // Tell Next.js to re-render the profile page so the changes show up immediately
    revalidatePath(`/${user.username}`);

    return { success: true };
}

export async function joinWaitlist(formData: FormData) {
    const email = formData.get('email');

    if (!email || typeof email !== 'string') {
        return { success: false, error: 'Valid email is required.' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { error } = await supabase
            .from('waitlist')
            .insert([{ email }]);

        if (error) {
            // if unique violation, consider it a success
            if (error.code === '23505') {
                return { success: true };
            }
            return { success: false, error: 'Database error occurred.' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function cancelSubscription(subscriptionId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "You must be logged in to cancel your subscription." };
    }

    try {
        const { dodo } = await import('@/lib/dodo');

        // Use the Dodo SDK to cancel the subscription
        // Assuming subscription has a cancel method based on ID
        await dodo.subscriptions.update(subscriptionId, {
            status: "cancelled"
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error cancelling subscription via Dodo:", error);
        return { success: false, error: error.message || "Failed to cancel subscription." };
    }
}
