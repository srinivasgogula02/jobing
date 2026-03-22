// ─────────────────────────────────────────────────────────────────────────────
// profileConfig.ts · Shared config for profile schema, completion scoring,
//                    section metadata, and sanitization utilities
// ─────────────────────────────────────────────────────────────────────────────

// ── Mandatory Fields ─────────────────────────────────────────────────────────
export interface MandatoryField {
  key: string;
  label: string;
  /** Returns true when the field is considered "filled" */
  validate: (value: unknown) => boolean;
}

const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0;
const nonEmptyString = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const nonEmptyObject = (v: unknown) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && Object.values(v as Record<string, unknown>).some(Boolean);

export const MANDATORY_FIELDS: MandatoryField[] = [
  { key: 'contactInfo', label: 'Contact Information', validate: nonEmptyObject },
  { key: 'education', label: 'Education', validate: nonEmptyArray },
  { key: 'experience', label: 'Work Experience', validate: nonEmptyArray },
  { key: 'skills', label: 'Skills', validate: nonEmptyArray },
  { key: 'objective', label: 'Summary / Objective', validate: nonEmptyString },
];

// ── Completion Score ─────────────────────────────────────────────────────────
export interface CompletionResult {
  score: number;   // how many mandatory fields are filled
  total: number;   // total mandatory fields
  percent: number; // 0-100
  missing: { key: string; label: string }[];
}

export function computeCompletionScore(
  profileData: Record<string, unknown> | null | undefined
): CompletionResult {
  const data = profileData || {};
  const missing: { key: string; label: string }[] = [];
  let filled = 0;

  for (const field of MANDATORY_FIELDS) {
    if (field.validate(data[field.key])) {
      filled++;
    } else {
      missing.push({ key: field.key, label: field.label });
    }
  }

  return {
    score: filled,
    total: MANDATORY_FIELDS.length,
    percent: Math.round((filled / MANDATORY_FIELDS.length) * 100),
    missing,
  };
}

// ── Section Display Metadata ─────────────────────────────────────────────────
// Maps known JSON keys → Lucide icon name (string) used in ProfileSummary
export const SECTION_ICONS: Record<string, string> = {
  contactInfo: 'Mail',
  education: 'GraduationCap',
  experience: 'Briefcase',
  projects: 'Rocket',
  skills: 'Wrench',
  objective: 'FileText',
  certifications: 'Award',
  languages: 'Globe',
  publications: 'BookOpen',
  volunteerWork: 'Heart',
  hobbies: 'Smile',
  awards: 'Trophy',
  references: 'Users',
  testScores: 'BarChart3',
  courses: 'BookMarked',
  portfolioLinks: 'Link',
};

export const SECTION_LABELS: Record<string, string> = {
  contactInfo: 'Contact',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  objective: 'Summary',
  certifications: 'Certifications',
  languages: 'Languages',
  publications: 'Publications',
  volunteerWork: 'Volunteer Work',
  hobbies: 'Hobbies & Interests',
  awards: 'Awards & Honors',
  references: 'References',
  testScores: 'Test Scores',
  courses: 'Courses',
  portfolioLinks: 'Portfolio Links',
};

/** Convert a camelCase key to a human-friendly label */
export function humanize(key: string): string {
  return SECTION_LABELS[key] || key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ── Section ordering ─────────────────────────────────────────────────────────
// Known sections appear in this order; unknown sections appear after them
const SECTION_ORDER: string[] = [
  'objective',
  'contactInfo',
  'education',
  'experience',
  'projects',
  'skills',
  'certifications',
  'languages',
  'publications',
  'volunteerWork',
  'awards',
  'hobbies',
  'testScores',
  'courses',
  'portfolioLinks',
  'references',
];

export function sortedSectionKeys(profileData: Record<string, unknown>): string[] {
  const knownKeys = SECTION_ORDER.filter((k) => k in profileData);
  const unknownKeys = Object.keys(profileData).filter((k) => !SECTION_ORDER.includes(k));
  return [...knownKeys, ...unknownKeys.sort()];
}

// ── Sanitization ─────────────────────────────────────────────────────────────
/** Recursively strip HTML tags from all string values to prevent XSS */
export function sanitizeProfileData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>/g, '');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeProfileData);
  }
  if (data !== null && typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      cleaned[k] = sanitizeProfileData(v);
    }
    return cleaned;
  }
  return data;
}

// ── Deep Merge ───────────────────────────────────────────────────────────────
/** Recursively merge source into target. Arrays are replaced (not concatenated)
 *  because the AI always sends the full updated array. */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      // Both are plain objects — recurse
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
