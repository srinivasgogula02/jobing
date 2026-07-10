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
