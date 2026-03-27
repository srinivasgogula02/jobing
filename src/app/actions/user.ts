"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function getUserCredits() {
    const user = await currentUser();

    if (!user) {
        return 0;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
        return 0;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

    if (error || !data) {
        return 0;
    }

    return data.credits || 0;
}

export async function markProfileCompletionPopupSeen() {
    const user = await currentUser();
    if (!user) return { success: false };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('profile_data')
        .eq('clerk_user_id', user.id)
        .single();
    
    if (profile) {
        const newData = { ...(profile.profile_data || {}), hasSeenCompletionPopup: true };
        await supabaseAdmin
            .from('user_profiles')
            .update({ profile_data: newData })
            .eq('clerk_user_id', user.id);
    }
    
    return { success: true };
}

export async function clearProfileData() {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ profile_data: {} })
        .eq('clerk_user_id', user.id);
    
    if (error) {
        console.error('Error clearing profile data:', error);
        return { success: false, error: 'Failed to clear profile data' };
    }
    
    return { success: true };
}
