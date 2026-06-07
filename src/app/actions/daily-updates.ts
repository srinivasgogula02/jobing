"use server";

import { createClient } from "@supabase/supabase-js";

export interface DailyUpdate {
  id: string;
  created_at: string;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  published: boolean;
  image_url?: string | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getPublishedDailyUpdates(): Promise<DailyUpdate[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daily_updates')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching daily updates:", error);
    return [];
  }

  return data as DailyUpdate[];
}

export async function getTodaysDailyUpdate(): Promise<DailyUpdate | null> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_updates')
    .select('*')
    .eq('published', true)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching today's update:`, error);
    }
    return null;
  }

  return data as DailyUpdate;
}

export async function getDailyUpdateById(id: string): Promise<DailyUpdate | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daily_updates')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();

  if (error) {
    console.error(`Error fetching daily update ${id}:`, error);
    return null;
  }

  return data as DailyUpdate;
}
