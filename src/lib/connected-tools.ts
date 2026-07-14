import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidPageId, normalizePageId, PAGE_ID_ERROR } from "@/lib/page-id";
import { publicPageUrl } from "@/lib/pages-runtime-url";

const ID_REGEX = /^[a-zA-Z0-9-_]+$/;
const MAX_ID_LENGTH = 64;
const MAX_NOTE_LENGTH = 100_000;
const MAX_PAGE_LENGTH = 500_000;

export class ConnectedToolError extends Error {
  constructor(
    public readonly code:
      | "invalid_note_id"
      | "invalid_note_content"
      | "note_id_taken"
      | "note_storage_failed"
      | "invalid_page_id"
      | "invalid_page_html"
      | "page_id_taken"
      | "page_storage_failed",
    message: string,
  ) {
    super(message);
    this.name = "ConnectedToolError";
  }
}

function normalizeId(id: string) {
  return id.trim().toLowerCase();
}

function validateId(id: string, reserved?: Set<string>) {
  if (!id || id.length > MAX_ID_LENGTH || !ID_REGEX.test(id) || reserved?.has(id)) {
    throw new ConnectedToolError("invalid_note_id", "Use 1-64 letters, numbers, hyphens, or underscores for the ID.");
  }
}

export async function createConnectedNote(userId: string, requestedId: string, content: string) {
  const id = normalizeId(requestedId);
  validateId(id);
  if (!content || content.length > MAX_NOTE_LENGTH) {
    throw new ConnectedToolError("invalid_note_content", "Note content must be between 1 and 100,000 characters.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("copies").select("id").eq("id", id).maybeSingle();
  if (existing) throw new ConnectedToolError("note_id_taken", `The note ID "${id}" is already taken.`);

  const { error } = await supabase.from("copies").insert({
    id,
    content,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new ConnectedToolError("note_storage_failed", "The note could not be saved right now.");

  return { id, url: `${siteUrl()}/c/${id}` };
}

export async function deployConnectedPage(userId: string, requestedId: string, html: string) {
  const id = normalizePageId(requestedId);
  if (!isValidPageId(id)) {
    throw new ConnectedToolError("invalid_page_id", PAGE_ID_ERROR);
  }
  if (!html || html.length > MAX_PAGE_LENGTH) {
    throw new ConnectedToolError("invalid_page_html", "HTML must be between 1 and 500,000 characters.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("pages").select("id,user_id,html_content").eq("id", id).maybeSingle();
  if (existing) {
    // MCP clients retry when a successful response is lost. Treat an exact
    // owner/content replay as success while protecting every real collision.
    if (existing.user_id === userId && existing.html_content === html) return { id, url: publicPageUrl(id) };
    throw new ConnectedToolError("page_id_taken", `The page ID "${id}" is already taken.`);
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("pages").insert({
    id,
    html_content: html,
    user_id: userId,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new ConnectedToolError("page_storage_failed", "The page could not be deployed right now.");

  return { id, url: publicPageUrl(id) };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site").replace(/\/$/, "");
}
