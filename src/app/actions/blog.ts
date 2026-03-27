"use server";

import { createClient } from "@supabase/supabase-js";

export interface BlogPost {
    id: string;
    created_at: string;
    title: string;
    description: string;
    content: string;
    image_url: string | null;
    keywords: string | null;
    permalink: string;
    published: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Always create a new client instance for server actions
function getSupabase() {
    return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching blogs:", error);
        return [];
    }
    
    return data as BlogPost[];
}

export async function getBlogByPermalink(permalink: string): Promise<BlogPost | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('permalink', permalink)
        .eq('published', true)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is expected sometimes
            console.error(`Error fetching blog ${permalink}:`, error);
        }
        return null;
    }
    
    return data as BlogPost;
}
