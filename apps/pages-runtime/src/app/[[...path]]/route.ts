import { getPublicPage } from "@/lib/page-store";
import { renderErrorDocument, renderPageDocument } from "@/lib/page-document";
import { resolvePageId } from "@/lib/page-request";

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
    "form-action 'self' https://jobing.site",
    "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' https: 'unsafe-inline'",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
  ].join("; "),
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

function document(body: string, status = 200) {
  return new Response(body, { status, headers: documentHeaders });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const pageId = resolvePageId(
    request.headers.get("host") ?? new URL(request.url).host,
    path,
    process.env.PAGES_ROOT_DOMAIN,
  );

  if (!pageId) return document(renderErrorDocument("Page not found", "This page address is unavailable."), 404);

  try {
    const page = await getPublicPage(pageId);
    if (!page) return document(renderErrorDocument("Page not found", "This page has not been published."), 404);
    return document(renderPageDocument(page.html_content));
  } catch (error) {
    console.error("Pages Runtime could not load a page", error);
    return document(renderErrorDocument("Temporarily unavailable", "Please try again in a moment."), 503);
  }
}

