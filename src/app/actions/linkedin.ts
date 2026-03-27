"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { deepMerge, sanitizeProfileData } from "@/lib/profileConfig";

const LINKEDIN_SCRAPER_URL = "https://linkedin-scraper-vercel-theta.vercel.app/api/scrape";

import { generateText } from "ai";

/**
 * Uses an incredibly fast Gemini 3 Flash model to intelligently extract and reshape 
 * the messy LinkedIn JSON into our perfect internal schema. This prevents missed keys 
 * and handles unpredictable nesting or formatting beautifully.
 */
async function extractProfileWithAI(rawLinkedInData: any): Promise<Record<string, any>> {
  // 1. Strip out massive useless arrays/strings to save tokens and speed up latency
  const optimizedData = { ...rawLinkedInData };
  delete optimizedData.mutualConnections;
  delete optimizedData.pictureUrl;
  delete optimizedData.coverImageUrl;
  delete optimizedData.creatorInfo;

  const systemPrompt = `You are a world-class structured data extraction engine. 
Your sole purpose is to convert messy, raw LinkedIn scraper JSON into a clean, strictly typed JSON object that matches our platform's profile schema.

RULES:
1. Extract ALL meaningful professional data.
2. Clean up weird formatting, decode escaped characters, and strip raw HTML tags.
3. If a date is missing an endDate, assume "Present". Format dates cleanly (e.g. "MMM YYYY" or "YYYY").
4. Deduplicate the "skills" array.
5. You MUST return ONLY valid JSON. No markdown backticks. Do not include \`\`\`json. 

STRICT OUTPUT SCHEMA:
{
  "contactInfo": { "fullName": "string", "headline": "string", "location": "string", "country": "string", "linkedinUrl": "string" },
  "objective": "string (A unified professional summary)",
  "experience": [{ "title": "string", "company": "string", "location": "string", "startDate": "string", "endDate": "string", "duration": "string", "description": "string" }],
  "education": [{ "institution": "string", "degree": "string", "fieldOfStudy": "string", "startDate": "string", "endDate": "string", "grade": "string", "activities": "string", "description": "string" }],
  "skills": ["string"],
  "languages": [{ "name": "string", "proficiency": "string" }],
  "volunteerWork": [{ "role": "string", "organization": "string", "cause": "string", "startDate": "string", "endDate": "string", "description": "string" }],
  "certifications": [{ "name": "string", "authority": "string", "url": "string" }],
  "projects": [{ "title": "string", "description": "string", "url": "string" }],
  "awards": [{ "title": "string", "issuer": "string", "description": "string" }],
  "publications": [{ "title": "string", "publisher": "string", "url": "string", "description": "string" }],
  "courses": [{ "name": "string", "number": "string" }]
}

If a section doesn't exist in the input, omit it or return an empty array. Do not hallucinate data.`;

  const prompt = `RAW LINKEDIN DATA:\n${JSON.stringify(optimizedData, null, 2)}`;

  try {
    const { text } = await generateText({
      model: 'google/gemini-3-flash' as any,
      system: systemPrompt,
      prompt: prompt,
    });

    const cleanedText = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("[AI Extraction Failed], falling back to empty object:", error);
    return {};
  }
}

/**
 * Server Action: Scrape a LinkedIn profile URL and merge the data into the user's profile.
 * Returns { success, message, profileData } or { success: false, error }.
 */
export async function importLinkedInProfile(linkedinUrl: string) {
  const LINKEDIN_API_KEY = process.env.LINKEDIN_SCRAPER_API_KEY;

  if (!LINKEDIN_API_KEY) {
    return { success: false, error: "LinkedIn import is not configured." };
  }

  // ── Auth ──────────────────────────────────────────────────────────────
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be logged in to import." };
  }

  // ── Validate LinkedIn URL ────────────────────────────────────────────
  const trimmed = linkedinUrl.trim();
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/;
  if (!linkedinPattern.test(trimmed)) {
    return { success: false, error: "Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/yourname)" };
  }

  // ── Call the LinkedIn Scraper API ─────────────────────────────────────
  try {
    const response = await fetch(LINKEDIN_SCRAPER_URL, {
      method: "POST",
      headers: {
        "X-API-Key": LINKEDIN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ linkedin_url: trimmed }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn Import] Scraper API error:", response.status, errorText);
      return { success: false, error: "LinkedIn scraping failed. The profile might be private or the URL is incorrect." };
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data[0]) {
      return { success: false, error: "Could not retrieve LinkedIn profile data. Please check the URL and try again." };
    }

    const linkedInData = result.data[0];

    // ── Map to our profile schema natively via AI ──────────────────────
    const mappedProfile = await extractProfileWithAI(linkedInData);
    const sanitized = sanitizeProfileData(mappedProfile) as Record<string, any>;

    // ── Merge with existing profile (preserve manually entered data) ────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from("user_profiles")
      .select("profile_data")
      .eq("clerk_user_id", user.id)
      .single();

    const currentProfile = existing?.profile_data || {};

    // Deep merge: LinkedIn data fills in gaps, existing manual data takes priority
    const mergedProfile = deepMerge(sanitized, currentProfile);

    // ── Save to Supabase ─────────────────────────────────────────────────
    const { error: upsertError } = await supabase
      .from("user_profiles")
      .upsert(
        { clerk_user_id: user.id, profile_data: mergedProfile },
        { onConflict: "clerk_user_id" }
      );

    if (upsertError) {
      console.error("[LinkedIn Import] Supabase error:", upsertError);
      return { success: false, error: "Failed to save imported profile data." };
    }

    // Count what was imported for user feedback
    const imported: string[] = [];
    if (sanitized.contactInfo) imported.push("Contact Info");
    if (sanitized.objective) imported.push("Summary");
    if (sanitized.experience?.length) imported.push(`${sanitized.experience.length} Work Experiences`);
    if (sanitized.education?.length) imported.push(`${sanitized.education.length} Education entries`);
    if (sanitized.skills?.length) imported.push(`${sanitized.skills.length} Skills`);
    if (sanitized.languages?.length) imported.push("Languages");
    if (sanitized.volunteerWork?.length) imported.push("Volunteer Work");
    if (sanitized.certifications?.length) imported.push("Certifications");
    if (sanitized.projects?.length) imported.push("Projects");

    console.log(`[LinkedIn Import] Successfully imported for user ${user.id}: ${imported.join(", ")}`);

    return {
      success: true,
      message: `Successfully imported: ${imported.join(", ")}`,
      profileData: mergedProfile,
    };
  } catch (err: any) {
    console.error("[LinkedIn Import] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
