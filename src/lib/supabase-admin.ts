import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the SERVICE ROLE key. This bypasses RLS and
// must NEVER be imported into a client component or shipped to the browser. The
// `server-only` import above makes any accidental client import a build error.
//
// The existing browser client lives in ./supabase.ts (anon key). Readiness PII
// (leads, consents) is reachable ONLY through this admin client inside server
// actions — see readiness_migration.sql for the deny-all RLS that enforces it.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
