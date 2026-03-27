"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { deepMerge, sanitizeProfileData } from "@/lib/profileConfig";

const LINKEDIN_SCRAPER_URL = "https://linkedin-scraper-vercel-theta.vercel.app/api/scrape";

/**
 * Deterministic, programmatic mapper. Extremely fast and 100% reliable 
 * compared to AI parsing, assuming the input schema is relatively stable.
 */
function extractProfileDeterministic(raw: any): Record<string, any> {
  const profile: Record<string, any> = {};

  // ── Contact Information ──────────────────────────────────────────────
  const fullName = [raw.firstName, raw.lastName].filter(Boolean).join(" ");
  profile.contactInfo = {
    fullName: fullName || undefined,
    headline: raw.headline || raw.jobTitle || undefined,
    location: raw.geoLocationName || undefined,
    country: raw.geoCountryName || raw.countryCode || undefined,
    linkedinUrl: raw.url || raw.publicIdentifier
      ? `https://www.linkedin.com/in/${raw.publicIdentifier}`
      : undefined,
  };

  // ── Summary / Objective ──────────────────────────────────────────────
  if (raw.summary) profile.objective = raw.summary;

  // ── Work Experience ──────────────────────────────────────────────────
  if (raw.positions && raw.positions.length > 0) {
    profile.experience = raw.positions.map((pos: any) => {
      const start = pos.timePeriod?.startDate;
      const end = pos.timePeriod?.endDate;
      return {
        title: pos.title || "",
        company: pos.company?.name || pos.companyName || "",
        location: pos.locationName || "",
        startDate: start ? `${start.month ? start.month + '/' : ''}${start.year || ""}` : "",
        endDate: end ? `${end.month ? end.month + '/' : ''}${end.year || ""}` : "Present",
        duration: pos.totalDuration || "",
        description: pos.description || "",
      };
    });
  }

  // ── Education ────────────────────────────────────────────────────────
  if (raw.educations && raw.educations.length > 0) {
    profile.education = raw.educations.map((edu: any) => {
      const start = edu.timePeriod?.startDate;
      const end = edu.timePeriod?.endDate;
      return {
        institution: edu.school?.name || edu.schoolName || "",
        degree: edu.degreeName || "",
        fieldOfStudy: edu.fieldOfStudy || "",
        startDate: start ? `${start.year || ""}` : "",
        endDate: end ? `${end.year || ""}` : "",
        grade: edu.grade || "",
        activities: edu.activities || "",
        description: edu.description || "",
      };
    });
  }

  // ── Skills (deduplicated) ────────────────────────────────────────────
  if (raw.skills && raw.skills.length > 0) {
    const seen = new Set<string>();
    profile.skills = raw.skills
      .map((s: any) => s.name)
      .filter((name: string) => {
        if (!name) return false;
        const lower = name.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
  }

  // ── Languages ────────────────────────────────────────────────────────
  if (raw.languages && raw.languages.length > 0) {
    profile.languages = raw.languages.map((lang: any) => ({
      name: lang.name || "",
      proficiency: lang.proficiency || "",
    }));
  }

  // ── Volunteer Work ───────────────────────────────────────────────────
  if (raw.volunteerExperiences && raw.volunteerExperiences.length > 0) {
    profile.volunteerWork = raw.volunteerExperiences.map((vol: any) => {
      const start = vol.timePeriod?.startDate;
      const end = vol.timePeriod?.endDate;
      return {
        role: vol.role || "",
        organization: vol.companyName || vol.company?.name || "",
        cause: vol.cause || "",
        startDate: start ? `${start.month ? start.month + '/' : ''}${start.year || ""}` : "",
        endDate: end ? `${end.month ? end.month + '/' : ''}${end.year || ""}` : "",
        description: vol.description || "",
      };
    });
  }

  // ── Certifications ───────────────────────────────────────────────────
  if (raw.certifications && raw.certifications.length > 0) {
    profile.certifications = raw.certifications.map((cert: any) => ({
      name: cert.name || "",
      authority: cert.authority || "",
      url: cert.url || "",
    }));
  }

  // ── Courses ──────────────────────────────────────────────────────────
  if (raw.courses && raw.courses.length > 0) {
    profile.courses = raw.courses.map((c: any) => ({
      name: c.name || "",
      number: c.number || "",
    }));
  }

  // ── Honors / Awards ──────────────────────────────────────────────────
  if (raw.honors && raw.honors.length > 0) {
    profile.awards = raw.honors.map((h: any) => ({
      title: h.title || "",
      issuer: h.issuer || "",
      description: h.description || "",
    }));
  }

  // ── Publications ─────────────────────────────────────────────────────
  if (raw.publications && raw.publications.length > 0) {
    profile.publications = raw.publications.map((p: any) => ({
      title: p.name || "",
      publisher: p.publisher || "",
      url: p.url || "",
      description: p.description || "",
    }));
  }

  // ── Projects ─────────────────────────────────────────────────────────
  if (raw.projects && raw.projects.length > 0) {
    profile.projects = raw.projects.map((p: any) => ({
      title: p.title || "",
      description: p.description || "",
      url: p.url || "",
    }));
  }

  return profile;
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

    // Explicit check for Apify subscription limits or custom JSON errors embedded in the response array
    if (linkedInData.error) {
        console.error("[LinkedIn Import] Apify returned an error inside JSON:", linkedInData.error);
        if (linkedInData.error.includes("hard limit") || linkedInData.error.includes("free user")) {
            return { success: false, error: "Scraper API Rate Limit Exceeded. The backend actor hit its free tier limit." };
        }
        return { success: false, error: "The scraping provider returned an error: " + linkedInData.error.substring(0, 100) };
    }

    // ── Map to our profile schema natively via exact programmatic extraction ────────────────
    const mappedProfile = extractProfileDeterministic(linkedInData);
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
