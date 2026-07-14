import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { acceptSubmission, getPublicForm } from "@/lib/forms-store";
import { renderPublicForm } from "@/lib/public-form-html";
import { isHoneypotRejection, validateSubmission } from "@/lib/submission-validation";
import { isPagesRuntimeOrigin } from "@/lib/platform-origin";
import { parseSubmissionRequest, SubmissionRequestError } from "@/lib/submission-request";
import {
  captureFormsOperationalError,
  durationBucket,
  recordFormSubmissionCompletion,
  type FormSubmissionTelemetry,
} from "@/lib/server-telemetry";

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
  const startedAt = Date.now();
  const originHeader = request.headers.get("origin");
  const contentType = request.headers.get("content-type") ?? "";
  const wantsJson = (request.headers.get("accept")?.includes("application/json") ?? false) || contentType.includes("application/json");
  const platformOrigin = isPagesRuntimeOrigin(originHeader);
  let responseOrigin = platformOrigin ? originHeader : null;
  const source: FormSubmissionTelemetry["source"] = platformOrigin ? "generated_page" : originHeader ? "custom_site" : "direct";
  const responseMode: FormSubmissionTelemetry["response_mode"] = wantsJson ? "json" : "browser";
  let telemetryRecorded = false;
  const complete = <T extends Response>(
    response: T,
    metadata: Omit<FormSubmissionTelemetry, "duration_bucket" | "response_mode" | "source">,
    error?: unknown,
  ) => {
    if (!telemetryRecorded) {
      telemetryRecorded = true;
      const completion: FormSubmissionTelemetry = {
        ...metadata,
        response_mode: responseMode,
        source,
        duration_bucket: durationBucket(Date.now() - startedAt),
      };
      recordFormSubmissionCompletion(completion);
      if (error !== undefined) captureFormsOperationalError(error, completion);
    }
    return response;
  };

  try {
  const { endpoint } = await context.params;
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BYTES) return complete(jsonError("request_too_large", "The submission is too large.", 413, responseOrigin), { outcome: "rejected", reason: "request_too_large", status_code: 413 });
  const form = await getPublicForm(endpoint);
  if (!form) return complete(jsonError("form_not_found", "This form is unavailable.", 404, responseOrigin), { outcome: "rejected", reason: "form_not_found", status_code: 404 });
  if (originHeader && (form.definition.settings?.allowedOrigins ?? []).includes(originHeader)) responseOrigin = originHeader;
  let data: FormData;
  try {
    data = (await parseSubmissionRequest(request, MAX_BYTES)).data;
  } catch (error) {
    if (error instanceof SubmissionRequestError) {
      const status = error.code === "request_too_large" ? 413 : error.code === "unsupported_media_type" ? 415 : 400;
      const message = status === 413 ? "The submission is too large." : status === 415 ? "Submit the form as form data or JSON." : "The submission payload is invalid.";
      return complete(jsonError(error.code, message, status, responseOrigin), {
        outcome: "rejected",
        reason: error.code,
        status_code: status,
      });
    }
    return complete(jsonError("invalid_payload", "The submission payload is invalid.", 400, responseOrigin), { outcome: "rejected", reason: "invalid_payload", status_code: 400 });
  }
  const approximateBytes = [...data.entries()].reduce((sum, [key, value]) => sum + Buffer.byteLength(key) + (typeof value === "string" ? Buffer.byteLength(value) : value.size), 0);
  if (approximateBytes > MAX_BYTES || [...data.keys()].length > 120) return complete(jsonError("request_too_large", "The submission is too large.", 413, responseOrigin), { outcome: "rejected", reason: "request_too_large", status_code: 413 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const hostedOrigin = new URL(process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site").origin;
  if (isHoneypotRejection({ value: String(data.get("_gotcha") || ""), origin: originHeader, hostedOrigin })) {
    return complete(NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303), { outcome: "rejected", reason: "honeypot", status_code: 303 });
  }
  const turnstileToken = String(data.get("cf-turnstile-response") || "");
  const isHostedForm = data.get("_jobing_form_context") === "hosted";
  if ((isHostedForm || turnstileToken) && !await verifyTurnstile(turnstileToken, ip)) return complete(jsonError("challenge_failed", "Please complete the security check and try again.", 400, responseOrigin), { outcome: "rejected", reason: "challenge_failed", status_code: 400 });
  const raw: Record<string, unknown> = {};
  for (const field of form.definition.fields) {
    const values = data.getAll(field.key).filter((value): value is string => typeof value === "string");
    raw[field.key] = values.length > 1 ? values : values[0];
  }
  const validated = validateSubmission(form.definition, raw);
  if (!validated.success) {
    if (wantsJson) return complete(NextResponse.json({ error: { code: "validation_failed", message: "Check the highlighted fields and try again.", fields: validated.errors } }, { status: 422, headers: corsHeaders(responseOrigin) }), { outcome: "rejected", reason: "validation_failed", status_code: 422 });
    return complete(html(renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "", submissionId: String(data.get("_submission_id") || randomUUID()), errors: validated.errors }), 422), { outcome: "rejected", reason: "validation_failed", status_code: 422 });
  }
  const secret = process.env.SUBMISSION_IP_HASH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return complete(jsonError("unavailable", "Forms is temporarily unavailable.", 503, responseOrigin), { outcome: "unavailable", reason: "configuration_missing", status_code: 503 }, new Error("Forms submission configuration is unavailable"));
  const origin = originHeader === hostedOrigin || platformOrigin ? null : originHeader;
  try {
    const result = await acceptSubmission({ endpointId: endpoint, idempotencyKey: String(data.get("_submission_id") || request.headers.get("idempotency-key") || randomUUID()), values: validated.values, origin, ipHash: createHmac("sha256", secret).update(`${new Date().toISOString().slice(0,10)}:${ip || "unknown"}`).digest("hex") });
    if (wantsJson) return complete(NextResponse.json({ data: result }, { status: 201, headers: corsHeaders(responseOrigin) }), { outcome: "accepted", reason: "success", status_code: 201 });
    if (result.redirectUrl) return complete(NextResponse.redirect(result.redirectUrl, 303), { outcome: "accepted", reason: "success", status_code: 303 });
    return complete(NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303), { outcome: "accepted", reason: "success", status_code: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("RATE_LIMITED") ? 429 : message.includes("ORIGIN_NOT_ALLOWED") ? 403 : message.includes("FORM_LIMIT_REACHED") ? 429 : 500;
    const reason: FormSubmissionTelemetry["reason"] = status === 429 ? "rate_limited" : status === 403 ? "origin_not_allowed" : "submission_failed";
    return complete(jsonError(reason, status === 500 ? "The response could not be saved." : "This submission is not allowed.", status, responseOrigin), { outcome: status === 500 ? "unavailable" : "rejected", reason, status_code: status }, status === 500 ? error : undefined);
  }
  } catch (error) {
    return complete(
      jsonError("submission_failed", "The response could not be saved.", 500, responseOrigin),
      { outcome: "unavailable", reason: "unhandled_exception", status_code: 500 },
      error,
    );
  }
}

export async function OPTIONS(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin) return new NextResponse(null, { status: 403 });
  // Generated pages are a first-party client. Approving their preflight before
  // the form lookup lets the browser receive a useful, CORS-wrapped 404 from
  // POST when an endpoint is stale or mistyped.
  if (!isPagesRuntimeOrigin(origin)) {
    const form = await getPublicForm((await context.params).endpoint);
    if (!form || !(form.definition.settings?.allowedOrigins ?? []).includes(origin)) return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type, Idempotency-Key", "access-control-max-age": "86400", vary: "Origin" } });
}
