"use server";

import { supabase } from "@/lib/supabase";

const ID_REGEX = /^[a-zA-Z0-9-_]+$/;
const MAX_ID_LENGTH = 64;
const MAX_CONTENT_LENGTH = 100000; // 100KB max per note

function isValidId(id: string) {
  return typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LENGTH && ID_REGEX.test(id);
}

export async function getNote(id: string) {
  if (!isValidId(id)) return null;

  const { data, error } = await supabase
    .from("copies")
    .select("content")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching note:", error);
    return null;
  }

  return data;
}

export async function saveNote(id: string, content: string) {
  if (!isValidId(id)) {
    return { success: false, error: "Invalid ID format or length exceeded." };
  }
  
  if (typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
    return { success: false, error: "Content exceeds maximum length of 100,000 characters." };
  }

  const { error } = await supabase.from("copies").upsert({
    id,
    content,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving note:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkIdTaken(id: string) {
  if (!isValidId(id)) return true; // Treat invalid IDs as taken so they can't be used

  const { data, error } = await supabase
    .from("copies")
    .select("id")
    .eq("id", id)
    .single();

  if (error && error.code === "PGRST116") {
    return false; // Not taken
  }

  return !!data;
}
