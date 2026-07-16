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
      | "page_not_found"
      | "page_changed"
      | "page_read_failed"
      | "page_storage_failed"
      | "page_update_failed"
      | "page_delete_failed",
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
  const { error } = await supabase.from("copies").insert({
    id,
    content,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error?.code === "23505") {
    throw new ConnectedToolError("note_id_taken", `The note ID "${id}" is already taken.`);
  }
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
  const now = new Date().toISOString();
  const { error } = await supabase.from("pages").insert({
    id,
    html_content: html,
    user_id: userId,
    created_at: now,
    updated_at: now,
  });
  if (error?.code === "23505") {
    // The common success path is one write. Only a collision pays for the read
    // needed to distinguish a safe MCP retry from somebody else's page ID.
    const { data: existing, error: readError } = await supabase
      .from("pages")
      .select("user_id,html_content")
      .eq("id", id)
      .maybeSingle();
    if (!readError && existing?.user_id === userId && existing.html_content === html) {
      return { id, url: publicPageUrl(id) };
    }
    if (readError) throw new ConnectedToolError("page_storage_failed", "The page could not be deployed right now.");
    throw new ConnectedToolError("page_id_taken", `The page ID "${id}" is already taken.`);
  }
  if (error) throw new ConnectedToolError("page_storage_failed", "The page could not be deployed right now.");

  return { id, url: publicPageUrl(id) };
}

export async function listConnectedPages(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new ConnectedToolError("page_read_failed", "Your pages could not be loaded right now.");
  return (data ?? []).map((page) => ({
    id: page.id,
    url: publicPageUrl(page.id),
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  }));
}

export async function getConnectedPage(userId: string, requestedId: string) {
  const id = normalizePageId(requestedId);
  if (!isValidPageId(id)) throw new ConnectedToolError("invalid_page_id", PAGE_ID_ERROR);

  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id,html_content,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new ConnectedToolError("page_read_failed", "The page could not be loaded right now.");
  if (!data) throw new ConnectedToolError("page_not_found", "That page was not found in your Jobing account.");
  return {
    id: data.id,
    html: data.html_content,
    url: publicPageUrl(data.id),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateConnectedPage(userId: string, requestedId: string, html: string, expectedUpdatedAt: string) {
  const id = normalizePageId(requestedId);
  if (!isValidPageId(id)) throw new ConnectedToolError("invalid_page_id", PAGE_ID_ERROR);
  if (!html || html.length > MAX_PAGE_LENGTH) {
    throw new ConnectedToolError("invalid_page_html", "HTML must be between 1 and 500,000 characters.");
  }

  const updatedAt = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .update({ html_content: html, updated_at: updatedAt })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id,updated_at")
    .maybeSingle();

  if (error) throw new ConnectedToolError("page_update_failed", "The page could not be updated right now.");
  if (!data) throw new ConnectedToolError("page_changed", "The page was changed after it was read. Load it again before updating.");
  return { id: data.id, url: publicPageUrl(data.id), updatedAt: data.updated_at };
}

export async function deleteConnectedPage(userId: string, requestedId: string) {
  const id = normalizePageId(requestedId);
  if (!isValidPageId(id)) throw new ConnectedToolError("invalid_page_id", PAGE_ID_ERROR);

  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw new ConnectedToolError("page_delete_failed", "The page could not be deleted right now.");
  if (!data) throw new ConnectedToolError("page_not_found", "That page was not found in your Jobing account.");
  return { id: data.id, deleted: true as const };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site").replace(/\/$/, "");
}
