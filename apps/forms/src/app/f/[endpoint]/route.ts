import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { acceptSubmission, getPublicForm } from "@/lib/forms-store";
import { renderPublicForm } from "@/lib/public-form-html";
import { isHoneypotRejection, validateSubmission } from "@/lib/submission-validation";
import { isPagesRuntimeOrigin } from "@/lib/platform-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 256 * 1024;

const securityHeaders = {
  "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'self'; script-src https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src https://challenges.cloudflare.com; form-action 'self' https://jobing.site; base-uri 'none'; frame-ancestors 'none'",
};

function html(body: string, status = 200) { return new NextResponse(body, { status, headers: securityHeaders }); }
function canonical(endpoint: string) { return `${process.env.NEXT_PUBLIC_FORMS_API_URL || "https://forms.jobing.site/forms"}/f/${encodeURIComponent(endpoint)}`; }
function corsHeaders(origin: string | null) { return origin ? { "access-control-allow-origin": origin, vary: "Origin" } : undefined; }
function jsonError(code: string, message: string, status: number, origin: string | null) {
  return NextResponse.json({ error: { code, message } }, { status, headers: corsHeaders(origin) });
}

export async function GET(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  const form = await getPublicForm(endpoint);
  if (!form) return html("<!doctype html><title>Form unavailable</title><p>This form is unavailable.</p>", 404);
  const submitted = new URL(request.url).searchParams.get("submitted") === "1";
  return html(renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA", submissionId: randomUUID(), ...(submitted ? { message: form.definition.confirmation.message } : {}) }));
}

async function verifyTurnstile(token: string, ip: string | null) {
  const url = process.env.TURNSTILE_VERIFY_URL;
  if (!url) return process.env.NODE_ENV !== "production";
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, remoteip: ip, action: "turnstile-spin-v1" }), signal: AbortSignal.timeout(5000), cache: "no-store" });
    const body = await response.json() as { success?: boolean; ok?: boolean };
    return response.ok && (body.success === true || body.ok === true);
  } catch { return false; }
}

export async function POST(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  const originHeader = request.headers.get("origin");
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const platformOrigin = isPagesRuntimeOrigin(originHeader);
  const responseOrigin = platformOrigin ? originHeader : null;
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BYTES) return jsonError("request_too_large", "The submission is too large.", 413, responseOrigin);
  const form = await getPublicForm(endpoint);
  if (!form) return jsonError("form_not_found", "This form is unavailable.", 404, responseOrigin);
  const data = await request.formData();
  const approximateBytes = [...data.entries()].reduce((sum, [key, value]) => sum + Buffer.byteLength(key) + (typeof value === "string" ? Buffer.byteLength(value) : value.size), 0);
  if (approximateBytes > MAX_BYTES || [...data.keys()].length > 120) return jsonError("request_too_large", "The submission is too large.", 413, responseOrigin);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const hostedOrigin = new URL(process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site").origin;
  if (isHoneypotRejection({ value: String(data.get("_gotcha") || ""), origin: originHeader, hostedOrigin })) {
    return NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303);
  }
  const turnstileToken = String(data.get("cf-turnstile-response") || "");
  const isHostedForm = data.get("_jobing_form_context") === "hosted";
  if ((isHostedForm || turnstileToken) && !await verifyTurnstile(turnstileToken, ip)) return jsonError("challenge_failed", "Please complete the security check and try again.", 400, responseOrigin);
  const raw: Record<string, unknown> = {};
  for (const field of form.definition.fields) {
    const values = data.getAll(field.key).filter((value): value is string => typeof value === "string");
    raw[field.key] = values.length > 1 ? values : values[0];
  }
  const validated = validateSubmission(form.definition, raw);
  if (!validated.success) {
    if (wantsJson) return NextResponse.json({ error: { code: "validation_failed", message: "Check the highlighted fields and try again.", fields: validated.errors } }, { status: 422, headers: corsHeaders(responseOrigin) });
    return html(renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "", submissionId: String(data.get("_submission_id") || randomUUID()), errors: validated.errors }), 422);
  }
  const secret = process.env.SUBMISSION_IP_HASH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return jsonError("unavailable", "Forms is temporarily unavailable.", 503, responseOrigin);
  const origin = originHeader === hostedOrigin || platformOrigin ? null : originHeader;
  try {
    const result = await acceptSubmission({ endpointId: endpoint, idempotencyKey: String(data.get("_submission_id") || request.headers.get("idempotency-key") || randomUUID()), values: validated.values, origin, ipHash: createHmac("sha256", secret).update(`${new Date().toISOString().slice(0,10)}:${ip || "unknown"}`).digest("hex") });
    if (wantsJson) return NextResponse.json({ data: result }, { status: 201, headers: corsHeaders(responseOrigin) });
    if (result.redirectUrl) return NextResponse.redirect(result.redirectUrl, 303);
    return NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("RATE_LIMITED") ? 429 : message.includes("ORIGIN_NOT_ALLOWED") ? 403 : message.includes("FORM_LIMIT_REACHED") ? 429 : 500;
    return jsonError(status === 429 ? "rate_limited" : status === 403 ? "origin_not_allowed" : "submission_failed", status === 500 ? "The response could not be saved." : "This submission is not allowed.", status, responseOrigin);
  }
}

export async function OPTIONS(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const form = await getPublicForm((await context.params).endpoint);
  const origin = request.headers.get("origin");
  if (!form || !origin || (!(form.definition.settings?.allowedOrigins ?? []).includes(origin) && !isPagesRuntimeOrigin(origin))) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type, Idempotency-Key", "access-control-max-age": "86400", vary: "Origin" } });
}
