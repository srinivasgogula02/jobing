"use server";

import { createClient } from "@supabase/supabase-js";
import { BLOG_PAGE_SIZE, type BlogListItem } from "@/lib/blog-config";

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

/**
 * Paginated, content-free blog listing.
 *
 * Fetches only one page worth of rows (via Supabase `.range`) and the total
 * count in a single round-trip, instead of `select('*')` over the whole table.
 * This keeps the /blog page's DB cost and payload flat as the blog count grows.
 */
export async function getPublishedBlogsPage(
    page = 1,
    pageSize = BLOG_PAGE_SIZE
): Promise<{ blogs: BlogListItem[]; total: number }> {
    const supabase = getSupabase();
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const from = (safePage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from('blogs')
        .select('id, created_at, title, description, image_url, permalink', { count: 'exact' })
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching blogs page:", error);
        return { blogs: [], total: 0 };
    }

    return { blogs: (data ?? []) as BlogListItem[], total: count ?? 0 };
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
