export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_publisher: string;
  job_employment_type: string;
  job_apply_link: string;
  job_description: string;
  job_is_remote: boolean;
  job_posted_at: string;
  job_posted_at_timestamp: number;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
}

export interface JSearchResponse {
  status: string;
  request_id: string;
  data: JSearchJob[];
}

const API_KEY = process.env.JSEARCH_API_KEY;

/**
 * Fetches jobs from OpenWeb Ninja JSearch API.
 * Uses aggressive Next.js ISR (revalidate: 43200 = 12 hours) to strictly protect the 200 req/month quota limit.
 */
export async function fetchJobs(query: string): Promise<JSearchJob[]> {
  if (!API_KEY) {
    console.warn("JSEARCH_API_KEY is missing. Returning empty array.");
    return [];
  }

  // Target: Indian 3rd/4th year students & freshers (no experience / under 3 years)
  const queryParams = new URLSearchParams({
    query: query,
    country: "in",
    employment_types: "FULLTIME,INTERN",
    job_requirements: "no_experience,under_3_years_experience", // Freshers & Juniors
    date_posted: "week", // active jobs
    page: "1",
    num_pages: "1" // maximum 10 results per query to save quota
  });

  const url = `https://api.openwebninja.com/jsearch/search?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
      },
      // Aggressive ISR Caching: Fetch once every 12 hours across ALL users globally.
      next: { revalidate: 43200 }, 
    });

    if (!res.ok) {
      console.error(`[JSearch API] Error ${res.status}: ${await res.text()}`);
      return [];
    }

    const json = (await res.json()) as JSearchResponse;
    return json?.data || [];
  } catch (error) {
    console.error("[JSearch API] Fetch Exception:", error);
    return [];
  }
}
