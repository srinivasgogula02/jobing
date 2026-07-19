import { unstable_cache } from "next/cache";

export type ProviderResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; reason: "not_configured" | "timeout" | "rate_limited" | "provider_error" };

export type EventCount = { event: string; count: number };
export type ActivationStep = { event: string; label: string; users: number };
export type ToolHealth = { tool: string; area: string; client: string; success: number; errors: number; runs: number; avgDurationMs: number };
export type FailureCount = { tool: string; code: string; count: number };
export type ActiveUsers = { day: number; week: number; month: number };
export type RuntimeSignal = { event: string; outcome: string; reason: string; count: number };
export type MissingCapability = { intent: string; client: string; count: number };
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

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown, fallback = "unknown") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
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
  const result = await postHogQuery("SELECT event, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event IN ('user_signed_up','connector_oauth_completed','mcp_request_completed','$mcp_initialize','$mcp_tools_list','$mcp_tool_call','$mcp_missing_capability','page_deploy_completed','form_draft_completed','form_publish_completed','form_submission_completed','generated_page_request_completed','connector_feedback_submitted','checkout_started','checkout_failed','payment_succeeded','payment_failed','subscription_activated','subscription_cancelled') GROUP BY event ORDER BY count() DESC LIMIT 40");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.map((row) => ({ event: text(row[0]), count: number(row[1]) })) };
}

async function loadActivation(): Promise<ProviderResult<ActivationStep[]>> {
  const result = await postHogQuery("SELECT event, uniq(distinct_id) FROM events WHERE timestamp > now() - INTERVAL 30 DAY AND ((event = 'user_signed_up') OR (event = 'connector_oauth_completed' AND properties.outcome = 'approved') OR (event = '$mcp_tool_call' AND properties.$mcp_is_error = false) OR (event IN ('page_deploy_completed','form_publish_completed','checkout_started','payment_succeeded') AND properties.outcome = 'success')) GROUP BY event");
  if (result.status !== "ok") return result;
  const labels: Record<string, string> = {
    user_signed_up: "Signed up",
    connector_oauth_completed: "Connected an AI app",
    "$mcp_tool_call": "Completed an AI action",
    page_deploy_completed: "Published a web page",
    form_publish_completed: "Published a form",
    checkout_started: "Started checkout",
    payment_succeeded: "Paid",
  };
  const counts = new Map(result.data.map((row) => [text(row[0]), number(row[1])]));
  return { status: "ok", data: Object.entries(labels).map(([event, label]) => ({ event, label, users: counts.get(event) ?? 0 })) };
}

async function loadToolHealth(): Promise<ProviderResult<ToolHealth[]>> {
  const result = await postHogQuery("SELECT properties.$mcp_tool_name, properties.product_area, coalesce(properties.client_type, properties.$mcp_client_name, 'unknown'), if(properties.$mcp_is_error = true, 'error', 'success'), count(), avg(toFloat(properties.$mcp_duration_ms)) FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event = '$mcp_tool_call' GROUP BY properties.$mcp_tool_name, properties.product_area, coalesce(properties.client_type, properties.$mcp_client_name, 'unknown'), if(properties.$mcp_is_error = true, 'error', 'success') ORDER BY count() DESC LIMIT 100");
  if (result.status !== "ok") return result;
  const grouped = new Map<string, ToolHealth & { weightedDuration: number }>();
  for (const row of result.data) {
    const tool = text(row[0]);
    const area = text(row[1]);
    const client = text(row[2]);
    const outcome = text(row[3]);
    const count = number(row[4]);
    const avgDuration = number(row[5]);
    const key = `${tool}:${area}:${client}`;
    const current = grouped.get(key) ?? { tool, area, client, success: 0, errors: 0, runs: 0, avgDurationMs: 0, weightedDuration: 0 };
    if (outcome === "success") current.success += count;
    else current.errors += count;
    current.runs += count;
    current.weightedDuration += avgDuration * count;
    grouped.set(key, current);
  }
  return {
    status: "ok",
    data: [...grouped.values()].map(({ weightedDuration, ...item }) => ({ ...item, avgDurationMs: item.runs ? Math.round(weightedDuration / item.runs) : 0 })).sort((a, b) => b.runs - a.runs),
  };
}

async function loadFailures(): Promise<ProviderResult<FailureCount[]>> {
  const result = await postHogQuery("SELECT properties.$mcp_tool_name, coalesce(properties.$mcp_error_type, 'tool_error'), count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event = '$mcp_tool_call' AND properties.$mcp_is_error = true GROUP BY properties.$mcp_tool_name, coalesce(properties.$mcp_error_type, 'tool_error') ORDER BY count() DESC LIMIT 30");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.map((row) => ({ tool: text(row[0]), code: text(row[1]), count: number(row[2]) })) };
}

async function loadActiveUsers(): Promise<ProviderResult<ActiveUsers>> {
  const result = await postHogQuery("SELECT uniqIf(distinct_id, timestamp > now() - INTERVAL 1 DAY), uniqIf(distinct_id, timestamp > now() - INTERVAL 7 DAY), uniq(distinct_id) FROM events WHERE timestamp > now() - INTERVAL 30 DAY AND event = '$mcp_tool_call' AND properties.$mcp_is_error = false");
  if (result.status !== "ok") return result;
  const row = result.data[0] ?? [];
  return { status: "ok", data: { day: number(row[0]), week: number(row[1]), month: number(row[2]) } };
}

async function loadMissingCapabilities(): Promise<ProviderResult<MissingCapability[]>> {
  const result = await postHogQuery("SELECT properties.$mcp_intent, coalesce(properties.client_type, properties.$mcp_client_name, 'unknown'), count() FROM events WHERE timestamp > now() - INTERVAL 30 DAY AND event = '$mcp_missing_capability' GROUP BY properties.$mcp_intent, coalesce(properties.client_type, properties.$mcp_client_name, 'unknown') ORDER BY count() DESC LIMIT 30");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.map((row) => ({ intent: text(row[0], "No safe intent supplied"), client: text(row[1]), count: number(row[2]) })) };
}

async function loadRuntimeSignals(): Promise<ProviderResult<RuntimeSignal[]>> {
  const result = await postHogQuery("SELECT event, properties.outcome, properties.reason, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY AND event IN ('form_submission_completed','generated_page_request_completed') GROUP BY event, properties.outcome, properties.reason ORDER BY count() DESC LIMIT 40");
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.map((row) => ({ event: text(row[0]), outcome: text(row[1]), reason: text(row[2], "none"), count: number(row[3]) })) };
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

export function sentryIssuesUrl(host: string, org: string, project: string) {
  return `${host.replace(/\/$/, "")}/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/?query=is%3Aunresolved&statsPeriod=14d&limit=20`;
}

async function loadSentryIssues(): Promise<ProviderResult<SentryIssue[]>> {
  const host = (process.env.SENTRY_HOST || "https://sentry.io").replace(/\/$/, "");
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const token = process.env.SENTRY_API_TOKEN;
  if (!org || !project || !token) return unavailable("not_configured");
  try {
    const response = await fetchWithTimeout(sentryIssuesUrl(host, org, project), { headers: { Authorization: `Bearer ${token}` } });
    if (!response) return unavailable("timeout");
    if (response.status === 429) return unavailable("rate_limited");
    if (!response.ok) return unavailable("provider_error");
    const rows = await response.json() as Array<Record<string, unknown>>;
    return { status: "ok", data: rows.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" && typeof row.permalink === "string" && typeof row.lastSeen === "string" ? [{
      id: row.id,
      title: row.title,
      count: number(row.count),
      users: number(row.userCount),
      permalink: row.permalink,
      lastSeen: row.lastSeen,
    }] : []) };
  } catch {
    return unavailable("provider_error");
  }
}

async function loadDashboardUncached() {
  const [events, activation, tools, failures, activeUsers, runtime, missingCapabilities, feedback, issues] = await Promise.allSettled([
    loadProductEvents(), loadActivation(), loadToolHealth(), loadFailures(), loadActiveUsers(), loadRuntimeSignals(), loadMissingCapabilities(), loadFeedback(), loadSentryIssues(),
  ]);
  const safe = <T,>(result: PromiseSettledResult<ProviderResult<T>>): ProviderResult<T> => result.status === "fulfilled" ? result.value : unavailable("provider_error");
  return {
    events: safe(events),
    activation: safe(activation),
    tools: safe(tools),
    failures: safe(failures),
    activeUsers: safe(activeUsers),
    runtime: safe(runtime),
    missingCapabilities: safe(missingCapabilities),
    feedback: safe(feedback),
    issues: safe(issues),
    generatedAt: new Date().toISOString(),
  };
}

export const loadDashboard = unstable_cache(loadDashboardUncached, ["jobing-admin-dashboard-v3"], { revalidate: 120 });
