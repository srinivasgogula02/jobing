import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ID_REGEX = /^[a-zA-Z0-9-_]+$/;
const MAX_ID_LENGTH = 64;
const MAX_NOTE_LENGTH = 100_000;
const MAX_PAGE_LENGTH = 500_000;
const RESERVED_PAGE_IDS = new Set([
  "new", "edit", "create", "delete", "admin", "api", "settings",
  "login", "signup", "logout", "dashboard", "tools", "copy",
]);

function normalizeId(id: string) {
  return id.trim().toLowerCase();
}

function validateId(id: string, reserved?: Set<string>) {
  if (!id || id.length > MAX_ID_LENGTH || !ID_REGEX.test(id) || reserved?.has(id)) {
    throw new Error("Use 1-64 letters, numbers, hyphens, or underscores for the ID.");
  }
}

export async function createConnectedNote(userId: string, requestedId: string, content: string) {
  const id = normalizeId(requestedId);
  validateId(id);
  if (!content || content.length > MAX_NOTE_LENGTH) {
    throw new Error("Note content must be between 1 and 100,000 characters.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("copies").select("id").eq("id", id).maybeSingle();
  if (existing) throw new Error(`The note ID "${id}" is already taken.`);

  const { error } = await supabase.from("copies").insert({
    id,
    content,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not create note: ${error.message}`);

  return { id, url: `${siteUrl()}/c/${id}` };
}

export async function deployConnectedPage(userId: string, requestedId: string, html: string) {
  const id = normalizeId(requestedId);
  validateId(id, RESERVED_PAGE_IDS);
  if (!html || html.length > MAX_PAGE_LENGTH) {
    throw new Error("HTML must be between 1 and 500,000 characters.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("pages").select("id").eq("id", id).maybeSingle();
  if (existing) throw new Error(`The page ID "${id}" is already taken.`);

  const now = new Date().toISOString();
  const { error } = await supabase.from("pages").insert({
    id,
    html_content: html,
    user_id: userId,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Could not deploy page: ${error.message}`);

  return { id, url: `${siteUrl()}/pages/${id}` };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site").replace(/\/$/, "");
}
