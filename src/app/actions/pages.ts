"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const ID_REGEX = /^[a-zA-Z0-9-_]+$/;
const MAX_ID_LENGTH = 64;
const MAX_CONTENT_LENGTH = 500000; // 500KB max per page

// Reserved slugs that must never be used as page IDs
const RESERVED_IDS = new Set([
  "new", "edit", "create", "delete", "admin", "api", "settings",
  "login", "signup", "logout", "dashboard", "tools", "copy",
]);

function isValidId(id: string) {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length <= MAX_ID_LENGTH &&
    ID_REGEX.test(id) &&
    !RESERVED_IDS.has(id)
  );
}

export async function getPage(id: string) {
  id = (id || "").toLowerCase();
  if (!isValidId(id)) return null;

  const { data, error } = await supabase
    .from("pages")
    .select("html_content, created_at, updated_at, user_id")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching page:", error);
    return null;
  }

  return data;
}

export async function savePage(id: string, htmlContent: string) {
  id = (id || "").toLowerCase();
  if (!isValidId(id)) {
    return { success: false, error: "Invalid ID. Use only letters, numbers, hyphens, and underscores (max 64 chars)." };
  }

  if (typeof htmlContent !== "string" || htmlContent.length === 0) {
    return { success: false, error: "HTML content cannot be empty." };
  }

  if (htmlContent.length > MAX_CONTENT_LENGTH) {
    return { success: false, error: `Content exceeds maximum length of ${(MAX_CONTENT_LENGTH / 1000).toFixed(0)}KB.` };
  }

  const { userId } = await auth();

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

  const payload: any = {
    id,
    html_content: htmlContent,
    updated_at: new Date().toISOString(),
  };

  // Only set user_id if we have one and we are creating a new page or updating our own
  if (userId) {
    payload.user_id = userId;
  }

  const { error } = await supabase.from("pages").upsert(payload);

  if (error) {
    console.error("Error saving page:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkPageIdTaken(id: string) {
  id = (id || "").toLowerCase();
  if (!isValidId(id)) return true; // Treat invalid IDs as taken

  const { data, error } = await supabase
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

  const { data, error } = await supabase
    .from("pages")
    .select("id, updated_at")
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

  id = (id || "").toLowerCase();
  
  // Verify ownership
  const page = await getPage(id);
  if (!page) return { success: false, error: "Page not found" };
  if (page.user_id !== userId) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
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
