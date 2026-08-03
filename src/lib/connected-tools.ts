import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidPageId, normalizePageId, PAGE_ID_ERROR } from "@/lib/page-id";
import { publicPageUrl } from "@/lib/pages-runtime-url";
import { getPageEntitlement } from "@/lib/page-entitlements";

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
      | "page_limit_reached"
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

type PageAddressRow = {
  id: string;
  custom_domain_id?: string | null;
  custom_path?: string | null;
};

async function connectedPageUrl(page: PageAddressRow, knownDomains?: Map<string, { hostname: string; status: string }>) {
  if (page.custom_domain_id && page.custom_path) {
    const data = knownDomains?.get(page.custom_domain_id) ?? (await getSupabaseAdmin().from("page_domains")
      .select("hostname,status")
      .eq("id", page.custom_domain_id)
      .maybeSingle()).data;
    if (data?.status === "verified" && data.hostname) return `https://${data.hostname}/${page.custom_path}`;
  }
  return publicPageUrl(page.id);
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
  const entitlement = await getPageEntitlement(userId);
  const { data, error } = await supabase.rpc("jobing_create_page", {
    p_user_id: userId,
    p_page_id: id,
    p_html: html,
    p_page_limit: entitlement.pageLimit,
  });
  if (error) throw new ConnectedToolError("page_storage_failed", "The page could not be deployed right now.");
  const result = data as { status?: string; count?: number; limit?: number } | null;
  if (result?.status === "page_id_taken") throw new ConnectedToolError("page_id_taken", `The page ID "${id}" is already taken.`);
  if (result?.status === "limit_reached") {
    throw new ConnectedToolError(
      "page_limit_reached",
      `Your ${entitlement.planName} plan includes ${entitlement.pageLimit} page${entitlement.pageLimit === 1 ? "" : "s"}. Upgrade to publish another.`,
    );
  }

  const { data: page } = await supabase.from("pages").select("id,custom_domain_id,custom_path").eq("id", id).eq("user_id", userId).maybeSingle();
  const url = await connectedPageUrl(page ?? { id });
  return { id, url, pageCount: result?.count ?? null, pageLimit: entitlement.pageLimit };
}

export async function listConnectedPages(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id,created_at,updated_at,custom_domain_id,custom_path")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new ConnectedToolError("page_read_failed", "Your pages could not be loaded right now.");
  const domainIds = [...new Set((data ?? []).map((page) => page.custom_domain_id).filter((value): value is string => Boolean(value)))];
  const domains = new Map<string, { hostname: string; status: string }>();
  if (domainIds.length) {
    const { data: domainRows, error: domainError } = await getSupabaseAdmin().from("page_domains").select("id,hostname,status").in("id", domainIds);
    if (domainError) throw new ConnectedToolError("page_read_failed", "Your page addresses could not be loaded right now.");
    for (const domain of domainRows ?? []) domains.set(domain.id, domain);
  }
  return Promise.all((data ?? []).map(async (page) => ({
    id: page.id,
    url: await connectedPageUrl(page, domains),
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  })));
}

export async function getConnectedPage(userId: string, requestedId: string) {
  const id = normalizePageId(requestedId);
  if (!isValidPageId(id)) throw new ConnectedToolError("invalid_page_id", PAGE_ID_ERROR);

  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id,html_content,created_at,updated_at,custom_domain_id,custom_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new ConnectedToolError("page_read_failed", "The page could not be loaded right now.");
  if (!data) throw new ConnectedToolError("page_not_found", "That page was not found in your Jobing account.");
  return {
    id: data.id,
    html: data.html_content,
    url: await connectedPageUrl(data),
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
    .select("id,updated_at,custom_domain_id,custom_path")
    .maybeSingle();

  if (error) throw new ConnectedToolError("page_update_failed", "The page could not be updated right now.");
  if (!data) throw new ConnectedToolError("page_changed", "The page was changed after it was read. Load it again before updating.");
  return { id: data.id, url: await connectedPageUrl(data), updatedAt: data.updated_at };
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
