"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function toggleFollow(targetUserId: string) {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Not signed in" };
    if (user.id === targetUserId) return { success: false as const, error: "You cannot follow yourself" };

    const supabase = getSupabaseAdmin();

    // Check if already following
    const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    if (existingFollow) {
        // Unfollow
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId);

        if (error) return { success: false as const, error: error.message };
    } else {
        // Follow
        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: targetUserId
            });

        if (error) return { success: false as const, error: error.message };
    }

    revalidatePath(`/[username]`, "layout");
    return { success: true as const, isFollowing: !existingFollow };
}

export async function getFollowStatus(targetUserId: string) {
    const user = await currentUser();
    if (!user) return { isFollowing: false };

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    return { isFollowing: !!data };
}

export async function getFollowStats(userId: string) {
    const supabase = getSupabaseAdmin();

    const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);

    return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0
    };
}
