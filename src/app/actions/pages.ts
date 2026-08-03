"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidPageId, normalizePageId, PAGE_ID_ERROR } from "@/lib/page-id";
import { getPageEntitlement } from "@/lib/page-entitlements";
import { getPreferredPageUrl } from "@/lib/page-domain-service";
import { auth } from "@clerk/nextjs/server";

const MAX_CONTENT_LENGTH = 500000; // 500KB max per page

export async function getPage(id: string) {
  id = normalizePageId(id || "");
  if (!isValidPageId(id)) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("html_content, created_at, updated_at, user_id, custom_domain_id, custom_path")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching page:", error);
    return null;
  }

  return data;
}

export async function savePage(id: string, htmlContent: string) {
  id = normalizePageId(id || "");
  if (!isValidPageId(id)) {
    return { success: false, error: PAGE_ID_ERROR };
  }

  if (typeof htmlContent !== "string" || htmlContent.length === 0) {
    return { success: false, error: "HTML content cannot be empty." };
  }

  if (htmlContent.length > MAX_CONTENT_LENGTH) {
    return { success: false, error: `Content exceeds maximum length of ${(MAX_CONTENT_LENGTH / 1000).toFixed(0)}KB.` };
  }

  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Sign in to publish and manage this page.", code: "sign_in_required" as const };
  }

  // Check if page already exists to enforce ownership
  const existingPage = await getPage(id);

  if (existingPage) {
    if (!existingPage.user_id) {
      return { success: false, error: "This page was deployed anonymously and cannot be edited." };
    }
    if (existingPage.user_id !== userId) {
      return { success: false, error: "You do not have permission to edit this page." };
    }
  }

  if (!existingPage) {
    const entitlement = await getPageEntitlement(userId);
    const { data, error } = await getSupabaseAdmin().rpc("jobing_create_page", {
      p_user_id: userId,
      p_page_id: id,
      p_html: htmlContent,
      p_page_limit: entitlement.pageLimit,
    });
    if (error) {
      console.error("Error creating page:", { code: error.code });
      return { success: false, error: "The page could not be published right now.", code: "page_storage_failed" as const };
    }
    const result = data as { status?: string; count?: number; limit?: number } | null;
    if (result?.status === "limit_reached") {
      return {
        success: false,
        error: `Your ${entitlement.planName} plan includes ${entitlement.pageLimit} page${entitlement.pageLimit === 1 ? "" : "s"}. Upgrade to publish another.`,
        code: "page_limit_reached" as const,
        upgradeUrl: "/pricing?from=page-limit",
      };
    }
    if (result?.status === "page_id_taken") {
      return { success: false, error: "That page address is already taken.", code: "page_id_taken" as const };
    }
    return { success: true, created: true as const, url: await getPreferredPageUrl(id) };
  }

  const { error } = await getSupabaseAdmin().from("pages").update({
    html_content: htmlContent,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", userId);

  if (error) {
    console.error("Error saving page:", error);
    return { success: false, error: error.message };
  }

  return { success: true, created: false as const, url: await getPreferredPageUrl(id) };
}

export async function renamePage(oldId: string, newId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to rename this page." };
  oldId = normalizePageId(oldId || "");
  newId = normalizePageId(newId || "");
  if (!isValidPageId(oldId) || !isValidPageId(newId)) return { success: false, error: PAGE_ID_ERROR };
  const { data, error } = await getSupabaseAdmin().rpc("jobing_rename_page", {
    p_user_id: userId,
    p_old_id: oldId,
    p_new_id: newId,
  });
  if (error) return { success: false, error: "The page address could not be changed right now." };
  const result = data as { status?: string } | null;
  if (result?.status === "page_id_taken") return { success: false, error: "That page address is already taken." };
  if (result?.status === "not_found") return { success: false, error: "Page not found." };
  return { success: true };
}

export async function checkPageIdTaken(id: string) {
  id = normalizePageId(id || "");
  if (!isValidPageId(id)) return true; // Treat invalid IDs as taken

  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id")
    .eq("id", id)
    .single();

  if (error && error.code === "PGRST116") {
    return false; // Not taken
  }

  return !!data;
}

export async function getUserPages() {
  const { userId } = await auth();
  if (!userId) return [];
  return getUserPagesForUser(userId);
}

export async function getUserPagesForUser(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("pages")
    .select("id, created_at, updated_at, custom_domain_id, custom_path")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching user pages:", error);
    return [];
  }

  return data || [];
}

export async function deletePage(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  id = normalizePageId(id || "");
  if (!isValidPageId(id)) return { success: false, error: "Page not found" };
  
  // Verify ownership
  const page = await getPage(id);
  if (!page) return { success: false, error: "Page not found" };
  if (page.user_id !== userId) return { success: false, error: "Unauthorized" };

  const { error } = await getSupabaseAdmin()
    .from("pages")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting page:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
