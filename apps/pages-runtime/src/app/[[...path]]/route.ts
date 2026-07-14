import { createHash } from "node:crypto";
import { getPublicPage } from "@/lib/page-store";
import { renderErrorDocument, renderPageDocument } from "@/lib/page-document";
import { resolvePageId } from "@/lib/page-request";
import {
  capturePagesOperationalError,
  durationBucket,
  recordPageRequestCompletion,
  type PageRequestTelemetry,
} from "@/lib/server-telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentHeaders = {
  "cache-control": "no-store",
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": [
    "default-src 'self' https: data: blob:",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://forms.jobing.site",
    "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' https: 'unsafe-inline'",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
  ].join("; "),
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "origin-agent-cluster": "?1",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), document-domain=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-permitted-cross-domain-policies": "none",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

type CacheMode = "page" | "not-found" | "error";

function responseHeaders(mode: CacheMode, etag?: string) {
  const headers = new Headers(documentHeaders);
  if (mode === "page") {
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    headers.set("cdn-cache-control", "public, s-maxage=15, stale-while-revalidate=45");
    headers.set("vercel-cdn-cache-control", "public, s-maxage=15, stale-while-revalidate=45");
  } else if (mode === "not-found") {
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    headers.set("cdn-cache-control", "public, s-maxage=5");
    headers.set("vercel-cdn-cache-control", "public, s-maxage=5");
  }
  if (etag) headers.set("etag", etag);
  return headers;
}

function document(body: string, status = 200, mode: CacheMode = "not-found", etag?: string) {
  return new Response(body, { status, headers: responseHeaders(mode, etag) });
}

function pageEtag(body: string): string {
  return `"${createHash("sha256").update(body).digest("base64url")}"`;
}

function requestHasEtag(request: Request, etag: string): boolean {
  return (request.headers.get("if-none-match") ?? "")
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag || value === `W/${etag}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const startedAt = Date.now();
  const { path } = await context.params;
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const rootDomain = process.env.PAGES_ROOT_DOMAIN?.trim().toLowerCase();
  const normalizedHost = host.toLowerCase().replace(/\.$/, "").split(":", 1)[0];
  const routeMode: PageRequestTelemetry["route_mode"] = path?.length
    ? "path"
    : rootDomain && normalizedHost?.endsWith(`.${rootDomain}`)
      ? "subdomain"
      : "unknown";
  let telemetryRecorded = false;
  const complete = <T extends Response>(
    response: T,
    metadata: Omit<PageRequestTelemetry, "duration_bucket" | "route_mode">,
    error?: unknown,
  ) => {
    if (!telemetryRecorded) {
      telemetryRecorded = true;
      const completion: PageRequestTelemetry = {
        ...metadata,
        route_mode: routeMode,
        duration_bucket: durationBucket(Date.now() - startedAt),
      };
      recordPageRequestCompletion(completion);
      if (error !== undefined) capturePagesOperationalError(error, completion);
    }
    return response;
  };
  const pageId = resolvePageId(
    host,
    path,
    rootDomain,
  );

  if (!pageId) return complete(document(renderErrorDocument("Page not found", "This page address is unavailable."), 404), { outcome: "not_found", reason: "invalid_address", status_code: 404 });

  try {
    const page = await getPublicPage(pageId);
    if (!page) return complete(document(renderErrorDocument("Page not found", "This page has not been published."), 404), { outcome: "not_found", reason: "unpublished", status_code: 404 });
    const body = renderPageDocument(page.html_content);
    const etag = pageEtag(body);
    if (requestHasEtag(request, etag)) {
      return complete(new Response(null, { status: 304, headers: responseHeaders("page", etag) }), { outcome: "served", reason: "published", status_code: 304 });
    }
    return complete(document(body, 200, "page", etag), { outcome: "served", reason: "published", status_code: 200 });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Pages Runtime could not load a page", service: "pages-runtime" }));
    return complete(document(renderErrorDocument("Temporarily unavailable", "Please try again in a moment."), 503, "error"), { outcome: "unavailable", reason: "load_failed", status_code: 503 }, error);
  }
}
