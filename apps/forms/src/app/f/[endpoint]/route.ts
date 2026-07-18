import { createHmac, randomUUID } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { acceptSubmission, getPublicForm, recordBlockedSubmission } from "@/lib/forms-store";
import { renderPublicForm } from "@/lib/public-form-html";
import { formAvailability } from "@/lib/form-conditions";
import { isHoneypotRejection, validateSubmission } from "@/lib/submission-validation";
import { isPagesRuntimeOrigin } from "@/lib/platform-origin";
import { parseSubmissionRequest, SubmissionRequestError } from "@/lib/submission-request";
import { collectSubmissionFiles, MAX_UPLOAD_BYTES } from "@/lib/submission-files";
import {
  captureFormsOperationalError,
  durationBucket,
  recordFormSubmissionCompletion,
  type FormSubmissionTelemetry,
} from "@/lib/server-telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_VALUE_BYTES = 256 * 1024;
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + MAX_VALUE_BYTES;
const TURNSTILE_ACTION = "turnstile-spin-v1";

const securityHeaders = {
  "content-type": "text/html; charset=utf-8", "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'none'; connect-src 'self'; form-action 'self' https://jobing.site https://forms.jobing.site; base-uri 'none'; frame-ancestors 'none'",
};

function html(body: string, status = 200, cacheControl = "no-store") {
  return new NextResponse(body, { status, headers: { ...securityHeaders, "cache-control": cacheControl } });
}
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
  const availability = formAvailability(form.definition, form.submissionCount);
  return html(
    renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), ...(submitted ? { message: form.definition.confirmation.message } : !availability.accepting ? { closedMessage: availability.message } : {}) }),
    200,
    submitted ? "no-store" : "public, max-age=0, s-maxage=15, stale-while-revalidate=45",
  );
}

type TurnstileResult =
  | { status: "verified" }
  | { status: "rejected" }
  | { status: "unavailable"; error: Error };

const TURNSTILE_OPERATIONAL_ERRORS = new Set([
  "bad-request",
  "hostname-mismatch",
  "internal-error",
  "invalid-content-type",
  "invalid-input-secret",
  "missing-input-response",
  "missing-input-secret",
  "missing-token",
  "upstream-timeout",
  "upstream-unreachable",
]);

function expectedTurnstileHostname() {
  try {
    return new URL(process.env.NEXT_PUBLIC_FORMS_API_URL || "https://forms.jobing.site/forms").hostname;
  } catch {
    return "forms.jobing.site";
  }
}

async function verifyTurnstile(token: string, ip: string | null): Promise<TurnstileResult> {
  if (!token) return { status: "rejected" };
  const url = process.env.TURNSTILE_VERIFY_URL?.trim();
  if (!url) return { status: "unavailable", error: new Error("Turnstile verifier URL is not configured") };
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, remoteip: ip, action: TURNSTILE_ACTION }), signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) return { status: "unavailable", error: new Error(`Turnstile verifier returned HTTP ${response.status}`) };
    const body = await response.json() as { success?: boolean; hostname?: string; action?: string; "error-codes"?: string[] };
    if (body.success === true) {
      if (body.hostname !== expectedTurnstileHostname()) {
        return { status: "unavailable", error: new Error(`Turnstile verifier hostname mismatch: expected ${expectedTurnstileHostname()}`) };
      }
      if (body.action !== TURNSTILE_ACTION) {
        return { status: "unavailable", error: new Error(`Turnstile verifier action mismatch: expected ${TURNSTILE_ACTION}`) };
      }
      return { status: "verified" };
    }
    if (body.success === false) {
      const errorCodes = Array.isArray(body["error-codes"]) ? body["error-codes"] : [];
      if (errorCodes.some((code) => TURNSTILE_OPERATIONAL_ERRORS.has(code))) {
        return { status: "unavailable", error: new Error(`Turnstile verifier configuration or service failure: ${errorCodes.join(",") || "unknown"}`) };
      }
      return { status: "rejected" };
    }
    return { status: "unavailable", error: new Error("Turnstile verifier returned an invalid response") };
  } catch (error) {
    return { status: "unavailable", error: error instanceof Error ? error : new Error("Turnstile verifier request failed") };
  }
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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const secret = process.env.SUBMISSION_IP_HASH_SECRET;
  const ipHash = secret && Buffer.byteLength(secret) >= 32
    ? createHmac("sha256", secret).update(`${new Date().toISOString().slice(0,10)}:${ip || "unknown"}`).digest("hex")
    : null;
  const rememberBlocked = (reason: string) => {
    if (!ipHash) return;
    const operation = recordBlockedSubmission({ endpointId: endpoint, reason, origin: originHeader, ipHash }).catch(() => undefined);
    try { waitUntil(operation); } catch { void operation; }
  };
  if (length > MAX_REQUEST_BYTES) {
    rememberBlocked("request_too_large");
    return complete(jsonError("request_too_large", "The submission is too large.", 413, responseOrigin), { outcome: "rejected", reason: "request_too_large", status_code: 413 });
  }
  const parsedSubmission = parseSubmissionRequest(request, contentType.includes("application/json") ? MAX_VALUE_BYTES : MAX_REQUEST_BYTES)
    .then((result) => ({ ok: true as const, data: result.data }))
    .catch((error: unknown) => ({ ok: false as const, error }));
  const [form, parsed] = await Promise.all([getPublicForm(endpoint), parsedSubmission]);
  if (!form) return complete(jsonError("form_not_found", "This form is unavailable.", 404, responseOrigin), { outcome: "rejected", reason: "form_not_found", status_code: 404 });
  const allowedOrigins = form.definition.settings?.allowedOrigins ?? [];
  if (originHeader && (platformOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(originHeader))) responseOrigin = originHeader;
  if (!parsed.ok) {
    const error = parsed.error;
    if (error instanceof SubmissionRequestError) {
      const status = error.code === "request_too_large" ? 413 : error.code === "unsupported_media_type" ? 415 : 400;
      const message = status === 413 ? "The submission is too large." : status === 415 ? "Submit the form as form data or JSON." : "The submission payload is invalid.";
      rememberBlocked(error.code === "unsupported_media_type" ? "unsupported_media_type" : error.code === "request_too_large" ? "request_too_large" : "invalid_payload");
      return complete(jsonError(error.code, message, status, responseOrigin), {
        outcome: "rejected",
        reason: error.code,
        status_code: status,
      });
    }
    return complete(jsonError("invalid_payload", "The submission payload is invalid.", 400, responseOrigin), { outcome: "rejected", reason: "invalid_payload", status_code: 400 });
  }
  const data = parsed.data;
  let approximateBytes = 0;
  let valueCount = 0;
  for (const [key, value] of data.entries()) {
    valueCount += 1;
    approximateBytes += Buffer.byteLength(key) + (typeof value === "string" ? Buffer.byteLength(value) : value.size);
    if (approximateBytes > MAX_REQUEST_BYTES || valueCount > 120) break;
  }
  if (approximateBytes > MAX_REQUEST_BYTES || valueCount > 120) {
    rememberBlocked("request_too_large");
    return complete(jsonError("request_too_large", "The submission is too large.", 413, responseOrigin), { outcome: "rejected", reason: "request_too_large", status_code: 413 });
  }
  const hostedOrigin = new URL(process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site").origin;
  if (isHoneypotRejection({ value: String(data.get("_gotcha") || ""), origin: originHeader })) {
    rememberBlocked("honeypot");
    return complete(NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303), { outcome: "rejected", reason: "honeypot", status_code: 303 });
  }
  const turnstileToken = String(data.get("cf-turnstile-response") || "");
  const formsOrigin = new URL(canonical(endpoint)).origin;
  const isHostedForm = data.get("_jobing_form_context") === "hosted"
    && (!originHeader || originHeader === formsOrigin);
  if (turnstileToken && !isHostedForm) {
    const verification = await verifyTurnstile(turnstileToken, ip);
    if (verification.status === "rejected") {
      rememberBlocked("challenge_failed");
      const message = "The security check refreshed. Your answers are still here. Wait for the Send response button, then try again.";
      const response = jsonError("challenge_failed", message, 400, responseOrigin);
      return complete(response, { outcome: "rejected", reason: "challenge_failed", status_code: 400 });
    }
    if (verification.status === "unavailable") {
      const message = "The security check is temporarily unavailable. Wait a moment, then send your response again.";
      const response = jsonError("security_check_unavailable", message, 503, responseOrigin);
      return complete(response, { outcome: "unavailable", reason: "security_check_unavailable", status_code: 503 }, verification.error);
    }
  }
  const uploads = await collectSubmissionFiles(form.definition, data);
  const raw: Record<string, unknown> = {};
  for (const field of form.definition.fields) {
    if (field.type === "file") {
      raw[field.key] = uploads.names[field.key];
      continue;
    }
    const values = data.getAll(field.key).filter((value): value is string => typeof value === "string");
    raw[field.key] = values.length > 1 ? values : values[0];
  }
  const validated = validateSubmission(form.definition, raw);
  const validationErrors = { ...(validated.success ? {} : validated.errors), ...uploads.errors };
  if (!validated.success || Object.keys(uploads.errors).length > 0) {
    rememberBlocked("validation_failed");
    if (wantsJson) return complete(NextResponse.json({ error: { code: "validation_failed", message: "Check the highlighted fields and try again.", fields: validationErrors } }, { status: 422, headers: corsHeaders(responseOrigin) }), { outcome: "rejected", reason: "validation_failed", status_code: 422 });
    return complete(html(renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), submissionId: String(data.get("_submission_id") || randomUUID()), errors: validationErrors, values: raw }), 422), { outcome: "rejected", reason: "validation_failed", status_code: 422 });
  }
  if (!secret || Buffer.byteLength(secret) < 32) return complete(jsonError("unavailable", "Forms is temporarily unavailable.", 503, responseOrigin), { outcome: "unavailable", reason: "configuration_missing", status_code: 503 }, new Error("Forms submission configuration is unavailable"));
  const origin = originHeader === hostedOrigin || platformOrigin ? null : originHeader;
  try {
    const result = await acceptSubmission({ endpointId: endpoint, idempotencyKey: String(data.get("_submission_id") || request.headers.get("idempotency-key") || randomUUID()), values: validated.values, files: uploads.files, origin, ipHash: ipHash! });
    if (wantsJson) return complete(NextResponse.json({ data: result }, { status: 201, headers: corsHeaders(responseOrigin) }), { outcome: "accepted", reason: "success", status_code: 201 });
    if (result.redirectUrl) return complete(NextResponse.redirect(result.redirectUrl, 303), { outcome: "accepted", reason: "success", status_code: 303 });
    return complete(NextResponse.redirect(`${canonical(endpoint)}?submitted=1`, 303), { outcome: "accepted", reason: "success", status_code: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("RATE_LIMITED") ? 429 : message.includes("ORIGIN_NOT_ALLOWED") ? 403 : message.includes("FORM_CLOSED") ? 409 : message.includes("FORM_LIMIT_REACHED") ? 429 : 500;
    const reason: FormSubmissionTelemetry["reason"] = status === 429 ? "rate_limited" : status === 403 ? "origin_not_allowed" : status === 409 ? "form_closed" : "submission_failed";
    if (status === 429 || status === 403) rememberBlocked(reason);
    const publicMessage = status === 500 ? "The response could not be saved." : status === 409 ? form.definition.settings.closedMessage : "This submission is not allowed.";
    const response = status === 409 && !wantsJson
      ? html(renderPublicForm({ definition: form.definition, endpointId: endpoint, action: canonical(endpoint), closedMessage: publicMessage }), status)
      : jsonError(reason, publicMessage, status, responseOrigin);
    return complete(response, { outcome: status === 500 ? "unavailable" : "rejected", reason, status_code: status }, status === 500 ? error : undefined);
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
    const allowedOrigins = form?.definition.settings?.allowedOrigins ?? [];
    if (!form || (allowedOrigins.length > 0 && !allowedOrigins.includes(origin))) return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type, Idempotency-Key", "access-control-max-age": "86400", vary: "Origin" } });
}
