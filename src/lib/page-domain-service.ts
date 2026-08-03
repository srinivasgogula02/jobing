import "server-only";

import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPageEntitlement } from "@/lib/page-entitlements";
import { isValidPageId, normalizePageId, PAGE_ID_ERROR } from "@/lib/page-id";

const RESERVED_DOMAIN_SUFFIXES = ["jobing.site", "jobing.online", "vercel.app"];
const HOSTNAME_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

const verificationSchema = z.array(z.object({
  type: z.string().max(20),
  domain: z.string().max(253),
  value: z.string().max(2_000),
  reason: z.string().max(500).optional(),
})).default([]);

const projectDomainSchema = z.object({
  name: z.string(),
  apexName: z.string(),
  verified: z.boolean(),
  verification: verificationSchema.optional(),
});

const domainConfigSchema = z.object({
  configuredBy: z.enum(["A", "CNAME", "dns-01", "http"]).nullable(),
  misconfigured: z.boolean(),
  recommendedIPv4: z.array(z.object({ rank: z.number(), value: z.array(z.string()) })).default([]),
  recommendedCNAME: z.array(z.object({ rank: z.number(), value: z.string() })).default([]),
});

const pageDomainSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  hostname: z.string(),
  status: z.enum(["provisioning", "pending", "verified", "error"]),
  is_default: z.boolean(),
  verification: z.array(z.unknown()).default([]),
  dns_records: z.array(z.unknown()).default([]),
  error_code: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  verified_at: z.string().nullable(),
  last_checked_at: z.string().nullable(),
});

export type PageDomain = z.infer<typeof pageDomainSchema>;
export type PageDnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string; purpose: "routing" | "ownership" };

export class PageDomainError extends Error {
  constructor(
    public readonly code:
      | "invalid_domain"
      | "domain_limit_reached"
      | "domain_taken"
      | "domain_not_found"
      | "domain_not_ready"
      | "domain_provider_unavailable"
      | "page_not_found"
      | "page_path_taken"
      | "invalid_page_id",
    message: string,
  ) {
    super(message);
    this.name = "PageDomainError";
  }
}

export function normalizeCustomDomain(input: string): string {
  let value = input.trim().toLowerCase();
  if (!value) throw new PageDomainError("invalid_domain", "Enter a domain such as example.com or pages.example.com.");

  if (value.includes("://")) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new PageDomainError("invalid_domain", "Enter a valid domain without a page path.");
    }
    if (url.protocol !== "https:" || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash || url.port) {
      throw new PageDomainError("invalid_domain", "Enter only the domain, without a path, query, or port.");
    }
    value = url.hostname;
  }

  value = value.replace(/\.$/, "");
  const ascii = domainToASCII(value);
  if (!ascii || isIP(ascii) || !HOSTNAME_PATTERN.test(ascii) || ascii.includes("..") || ascii.startsWith("*.") || ascii.includes("_")) {
    throw new PageDomainError("invalid_domain", "Enter a public domain such as example.com or pages.example.com.");
  }
  if (RESERVED_DOMAIN_SUFFIXES.some((suffix) => ascii === suffix || ascii.endsWith(`.${suffix}`))) {
    throw new PageDomainError("invalid_domain", "Use a domain you own. Jobing and Vercel system domains cannot be connected.");
  }
  return ascii;
}

function vercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.PAGES_VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId || !teamId) {
    throw new PageDomainError("domain_provider_unavailable", "Custom domains are temporarily unavailable. Please try again later.");
  }
  return { token, projectId, teamId };
}

async function vercelRequest(path: string, init?: RequestInit) {
  const { token, teamId } = vercelConfig();
  const url = new URL(path, "https://api.vercel.com");
  url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
  if (!response.ok) {
    const error = new Error(body.error?.message || `Vercel returned ${response.status}.`) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = body.error?.code;
    throw error;
  }
  return body;
}

async function getProjectDomain(hostname: string) {
  const { projectId } = vercelConfig();
  return projectDomainSchema.parse(await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}`));
}

async function getDomainConfig(hostname: string) {
  const { projectId } = vercelConfig();
  return domainConfigSchema.parse(await vercelRequest(`/v6/domains/${encodeURIComponent(hostname)}/config?projectIdOrName=${encodeURIComponent(projectId)}&strict=false`));
}

function preferred<T extends { rank: number }>(values: T[]): T | undefined {
  return [...values].sort((left, right) => left.rank - right.rank)[0];
}

function dnsRecords(domain: z.infer<typeof projectDomainSchema>, config: z.infer<typeof domainConfigSchema>): PageDnsRecord[] {
  const records: PageDnsRecord[] = [];
  for (const challenge of domain.verification ?? []) {
    records.push({ type: "TXT", name: challenge.domain, value: challenge.value, purpose: "ownership" });
  }

  if (domain.name === domain.apexName) {
    const address = preferred(config.recommendedIPv4)?.value[0];
    if (address) records.push({ type: "A", name: "@", value: address, purpose: "routing" });
  } else {
    const cname = preferred(config.recommendedCNAME)?.value;
    if (cname) records.push({ type: "CNAME", name: domain.name, value: cname, purpose: "routing" });
  }
  return records;
}

async function persistProviderState(domainId: string, domain: z.infer<typeof projectDomainSchema>, config: z.infer<typeof domainConfigSchema>) {
  const ready = domain.verified && !config.misconfigured;
  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin().from("page_domains").update({
    status: ready ? "verified" : "pending",
    verification: domain.verification ?? [],
    dns_records: dnsRecords(domain, config),
    error_code: null,
    last_checked_at: now,
    updated_at: now,
    ...(ready ? { verified_at: now } : {}),
  }).eq("id", domainId);
  if (error) throw new PageDomainError("domain_provider_unavailable", "The domain status could not be saved. Please try again.");
}

async function markProviderFailure(domainId: string, code: string) {
  await getSupabaseAdmin().from("page_domains").update({
    status: "error",
    error_code: /^[a-z0-9_.-]{1,100}$/i.test(code) ? code : "provider_error",
    updated_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
  }).eq("id", domainId);
}

export async function listPageDomains(userId: string): Promise<PageDomain[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("page_domains")
    .select("id,user_id,hostname,status,is_default,verification,dns_records,error_code,created_at,updated_at,verified_at,last_checked_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new PageDomainError("domain_provider_unavailable", "Your domains could not be loaded right now.");
  return z.array(pageDomainSchema).parse(data ?? []);
}

export async function addPageDomain(userId: string, input: string) {
  const hostname = normalizeCustomDomain(input);
  const entitlement = await getPageEntitlement(userId);
  const { data, error } = await getSupabaseAdmin().rpc("jobing_reserve_page_domain", {
    p_user_id: userId,
    p_hostname: hostname,
    p_domain_limit: entitlement.customDomainLimit,
  });
  if (error) throw new PageDomainError("domain_provider_unavailable", "The domain could not be reserved right now.");
  const reservation = z.object({
    status: z.enum(["reserved", "existing", "limit_reached", "domain_taken"]),
    id: z.string().uuid().optional(),
    count: z.number().optional(),
    limit: z.number().optional(),
  }).parse(data);
  if (reservation.status === "limit_reached") {
    throw new PageDomainError("domain_limit_reached", `Your ${entitlement.planName} plan includes ${entitlement.customDomainLimit} custom domain${entitlement.customDomainLimit === 1 ? "" : "s"}. Upgrade to add another.`);
  }
  if (reservation.status === "domain_taken" || !reservation.id) {
    throw new PageDomainError("domain_taken", "That domain is already connected to another Jobing workspace.");
  }

  try {
    let projectDomain: z.infer<typeof projectDomainSchema> | null = null;
    if (reservation.status === "reserved") {
      const { projectId } = vercelConfig();
      await vercelRequest(`/v10/projects/${encodeURIComponent(projectId)}/domains`, {
        method: "POST",
        body: JSON.stringify({ name: hostname }),
      });
    } else {
      try {
        projectDomain = await getProjectDomain(hostname);
      } catch (lookupError) {
        if ((lookupError as { status?: number }).status !== 404) throw lookupError;
        const { projectId } = vercelConfig();
        await vercelRequest(`/v10/projects/${encodeURIComponent(projectId)}/domains`, {
          method: "POST",
          body: JSON.stringify({ name: hostname }),
        });
      }
    }
    const [resolvedDomain, config] = await Promise.all([projectDomain ?? getProjectDomain(hostname), getDomainConfig(hostname)]);
    await persistProviderState(reservation.id, resolvedDomain, config);
  } catch (error) {
    const providerError = error as { code?: string; status?: number };
    await markProviderFailure(reservation.id, providerError.code ?? `http_${providerError.status ?? 0}`);
    if (error instanceof PageDomainError) throw error;
    if (providerError.status === 409) throw new PageDomainError("domain_taken", "This domain is already assigned to another Vercel project. Remove it there first, then retry.");
    throw new PageDomainError("domain_provider_unavailable", "The domain provider could not complete setup. Try again in a moment.");
  }

  return { hostname, domainId: reservation.id, domainsDashboardUrl: "https://jobing.site/dashboard/pages#custom-domains" };
}

export async function refreshPageDomain(userId: string, domainId: string) {
  const { data, error } = await getSupabaseAdmin().from("page_domains")
    .select("id,hostname")
    .eq("id", domainId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new PageDomainError("domain_not_found", "That custom domain was not found.");

  try {
    const { projectId } = vercelConfig();
    await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(data.hostname)}/verify`, { method: "POST" }).catch((verifyError) => {
      const status = (verifyError as { status?: number }).status;
      if (status !== 400 && status !== 409) throw verifyError;
    });
    const [projectDomain, config] = await Promise.all([getProjectDomain(data.hostname), getDomainConfig(data.hostname)]);
    await persistProviderState(domainId, projectDomain, config);
    return { hostname: data.hostname, ready: projectDomain.verified && !config.misconfigured, dnsRecords: dnsRecords(projectDomain, config) };
  } catch (error) {
    if (error instanceof PageDomainError) throw error;
    throw new PageDomainError("domain_provider_unavailable", "DNS could not be checked right now. Your existing page addresses are unaffected. Try again shortly.");
  }
}

export async function removePageDomain(userId: string, domainId: string) {
  const { data, error } = await getSupabaseAdmin().from("page_domains")
    .select("id,hostname,is_default")
    .eq("id", domainId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new PageDomainError("domain_not_found", "That custom domain was not found.");

  try {
    const { projectId } = vercelConfig();
    await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(data.hostname)}`, {
      method: "DELETE",
      body: JSON.stringify({ removeRedirects: true }),
    }).catch((providerError) => {
      if ((providerError as { status?: number }).status !== 404) throw providerError;
    });
  } catch (error) {
    if (error instanceof PageDomainError) throw error;
    throw new PageDomainError("domain_provider_unavailable", "The hosting provider could not disconnect this domain right now. Nothing was removed. Try again shortly.");
  }

  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from("page_domains").delete().eq("id", domainId).eq("user_id", userId);
  if (deleteError) throw new PageDomainError("domain_provider_unavailable", "The domain was removed from hosting but could not be removed from your dashboard. Refresh and retry.");

  if (data.is_default) {
    const { data: next } = await supabase.from("page_domains").select("id").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (next?.id) await supabase.from("page_domains").update({ is_default: true }).eq("id", next.id).eq("user_id", userId);
  }
  return { hostname: data.hostname, removed: true as const };
}

export async function setPageCustomAddress(userId: string, requestedPageId: string, domainId: string | null, requestedPath: string) {
  const pageId = normalizePageId(requestedPageId);
  const path = normalizePageId(requestedPath);
  if (!isValidPageId(pageId) || !isValidPageId(path)) throw new PageDomainError("invalid_page_id", PAGE_ID_ERROR);

  const supabase = getSupabaseAdmin();
  const { data: page, error: pageError } = await supabase.from("pages").select("id").eq("id", pageId).eq("user_id", userId).maybeSingle();
  if (pageError || !page) throw new PageDomainError("page_not_found", "That page was not found in your Jobing account.");

  let hostname: string | null = null;
  let ready = false;
  if (domainId) {
    const { data: domain, error: domainError } = await supabase.from("page_domains")
      .select("hostname,status")
      .eq("id", domainId)
      .eq("user_id", userId)
      .maybeSingle();
    if (domainError || !domain) throw new PageDomainError("domain_not_found", "Choose a custom domain from this workspace.");
    hostname = domain.hostname;
    ready = domain.status === "verified";
  }

  const { error: updateError } = await supabase.from("pages").update({
    custom_domain_id: domainId,
    custom_path: path,
    updated_at: new Date().toISOString(),
  }).eq("id", pageId).eq("user_id", userId);
  if (updateError?.code === "23505") throw new PageDomainError("page_path_taken", `/${path} is already used on that domain.`);
  if (updateError) throw new PageDomainError("domain_provider_unavailable", "The page address could not be saved right now.");

  return {
    pageId,
    path,
    hostname,
    ready,
    customUrl: hostname ? `https://${hostname}/${path}` : null,
  };
}

export async function getPreferredPageUrl(pageId: string): Promise<string | null> {
  const { data: page, error } = await getSupabaseAdmin().from("pages")
    .select("id,custom_domain_id,custom_path")
    .eq("id", pageId)
    .maybeSingle();
  if (error || !page) return null;
  if (page.custom_domain_id && page.custom_path) {
    const { data: domain } = await getSupabaseAdmin().from("page_domains")
      .select("hostname,status")
      .eq("id", page.custom_domain_id)
      .maybeSingle();
    if (domain?.status === "verified") return `https://${domain.hostname}/${page.custom_path}`;
  }
  const root = (process.env.NEXT_PUBLIC_PAGES_ROOT_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (root) return `https://${page.id}.${root}`;
  const runtime = (process.env.NEXT_PUBLIC_PAGES_RUNTIME_URL || "https://jobing-pages.vercel.app").replace(/\/+$/, "");
  return `${runtime}/${encodeURIComponent(page.id)}`;
}
