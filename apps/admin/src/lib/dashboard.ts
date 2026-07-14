import { unstable_cache } from "next/cache";

export type ProviderResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; reason: "not_configured" | "timeout" | "rate_limited" | "provider_error" };

export type EventCount = { event: string; count: number };
export type ToolCount = { tool: string; outcome: string; count: number };
export type FeedbackItem = {
  id: string;
  kind: string;
  summary: string;
  useCase: string | null;
  blockedTool: string | null;
  status: string;
  createdAt: string;
};
export type SentryIssue = { id: string; title: string; count: number; users: number; permalink: string; lastSeen: string };

function unavailable<T>(reason: Extract<ProviderResult<T>, { status: "unavailable" }>["reason"]): ProviderResult<T> {
  return { status: "unavailable", reason };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 5_000) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) return null;
    throw error;
  }
}

async function postHogQuery(query: string): Promise<ProviderResult<unknown[][]>> {
  const host = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/$/, "");
  const project = process.env.POSTHOG_PROJECT_ID;
  const token = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!project || !token) return unavailable("not_configured");
  try {
    const response = await fetchWithTimeout(`${host}/api/projects/${encodeURIComponent(project)}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!response) return unavailable("timeout");
    if (response.status === 429) return unavailable("rate_limited");
    if (!response.ok) return unavailable("provider_error");
    const payload = await response.json() as { results?: unknown[][] };
    return { status: "ok", data: Array.isArray(payload.results) ? payload.results : [] };
  } catch {
    return unavailable("provider_error");
  }
}

async function loadProductEvents(): Promise<ProviderResult<EventCount[]>> {
  const result = await postHogQuery("SELECT event, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event IN ('connector_oauth_completed','mcp_request_completed','mcp_tool_completed','page_deploy_completed','form_draft_completed','form_publish_completed','form_submission_completed','generated_page_request_completed','connector_feedback_submitted') GROUP BY event ORDER BY count() DESC LIMIT 30");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.flatMap((row) => typeof row[0] === "string" && typeof row[1] === "number" ? [{ event: row[0], count: row[1] }] : []) };
}

async function loadToolCounts(): Promise<ProviderResult<ToolCount[]>> {
  const result = await postHogQuery("SELECT properties.tool_name, properties.outcome, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event = 'mcp_tool_completed' GROUP BY properties.tool_name, properties.outcome ORDER BY count() DESC LIMIT 50");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.flatMap((row) => typeof row[0] === "string" && typeof row[1] === "string" && typeof row[2] === "number" ? [{ tool: row[0], outcome: row[1], count: row[2] }] : []) };
}

async function loadFeedback(): Promise<ProviderResult<FeedbackItem[]>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return unavailable("not_configured");
  try {
    const response = await fetchWithTimeout(`${url.replace(/\/$/, "")}/rest/v1/rpc/list_connector_feedback`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_limit: 30 }),
    });
    if (!response) return unavailable("timeout");
    if (response.status === 429) return unavailable("rate_limited");
    if (!response.ok) return unavailable("provider_error");
    const rows = await response.json() as Array<Record<string, unknown>>;
    return { status: "ok", data: rows.flatMap((row) => typeof row.id === "string" && typeof row.kind === "string" && typeof row.summary === "string" && typeof row.created_at === "string" ? [{
      id: row.id,
      kind: row.kind,
      summary: row.summary,
      useCase: typeof row.use_case === "string" ? row.use_case : null,
      blockedTool: typeof row.blocked_tool === "string" ? row.blocked_tool : null,
      status: typeof row.status === "string" ? row.status : "new",
      createdAt: row.created_at,
    }] : []) };
  } catch {
    return unavailable("provider_error");
  }
}

async function loadSentryIssues(): Promise<ProviderResult<SentryIssue[]>> {
  const host = (process.env.SENTRY_HOST || "https://sentry.io").replace(/\/$/, "");
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const token = process.env.SENTRY_API_TOKEN;
  if (!org || !project || !token) return unavailable("not_configured");
  try {
    const response = await fetchWithTimeout(`${host}/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/?query=is%3Aunresolved&statsPeriod=7d&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response) return unavailable("timeout");
    if (response.status === 429) return unavailable("rate_limited");
    if (!response.ok) return unavailable("provider_error");
    const rows = await response.json() as Array<Record<string, unknown>>;
    return { status: "ok", data: rows.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" && typeof row.permalink === "string" && typeof row.lastSeen === "string" ? [{
      id: row.id,
      title: row.title,
      count: Number(row.count) || 0,
      users: Number(row.userCount) || 0,
      permalink: row.permalink,
      lastSeen: row.lastSeen,
    }] : []) };
  } catch {
    return unavailable("provider_error");
  }
}

async function loadDashboardUncached() {
  const [events, tools, feedback, issues] = await Promise.allSettled([
    loadProductEvents(), loadToolCounts(), loadFeedback(), loadSentryIssues(),
  ]);
  const safe = <T,>(result: PromiseSettledResult<ProviderResult<T>>): ProviderResult<T> => result.status === "fulfilled" ? result.value : unavailable("provider_error");
  return {
    events: safe(events),
    tools: safe(tools),
    feedback: safe(feedback),
    issues: safe(issues),
    generatedAt: new Date().toISOString(),
  };
}

export const loadDashboard = unstable_cache(loadDashboardUncached, ["jobing-admin-dashboard-v1"], { revalidate: 60 });
