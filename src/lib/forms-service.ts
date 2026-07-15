import "server-only";

import crypto from "node:crypto";
import { z } from "zod";

const REQUEST_TIMEOUT_MS = 8_000;
export const MAX_FORMS_INTERNAL_REQUEST_BYTES = 256 * 1024;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const PRODUCTION_FORMS_BASE_URL = "https://forms.jobing.site/forms";
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/-]{7,199}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{0,99}$/;
const SAFE_ERROR_MESSAGE_PATTERN = /^[^\u0000-\u001f\u007f]*$/u;

const formStatusSchema = z.enum(["draft", "published", "paused", "archived", "trashed"]);

const formSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: formStatusSchema,
  revision: z.coerce.number().int().positive(),
  publishedVersion: z.coerce.number().int().nonnegative(),
  endpointId: z.string(),
  definition: z.unknown(),
  updatedAt: z.string(),
});

const createdFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.literal("draft"),
  revision: z.coerce.number().int().positive(),
  endpointId: z.string(),
});

const publishedFormSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("published"),
  revision: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
  endpointId: z.string(),
});

const updatedFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: formStatusSchema,
  revision: z.coerce.number().int().positive(),
  endpointId: z.string(),
  definition: z.unknown(),
});

const submissionFileSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  fieldKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  byteSize: z.coerce.number().int().positive(),
  scanStatus: z.enum(["unscanned", "clean", "blocked"]),
});

const formResponseSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  receivedAt: z.string(),
  values: z.record(z.string(), z.unknown()),
  reviewState: z.enum(["inbox", "spam", "archived"]),
  fileCount: z.coerce.number().int().nonnegative(),
  files: z.array(submissionFileSchema),
});

const paginatedFormResponsesSchema = z.object({
  items: z.array(formResponseSchema),
  total: z.coerce.number().int().nonnegative(),
  page: z.coerce.number().int().positive(),
  pageSize: z.coerce.number().int().positive(),
  pages: z.coerce.number().int().positive(),
});

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().regex(SAFE_ERROR_CODE_PATTERN),
    message: z.string().min(1).max(500).regex(SAFE_ERROR_MESSAGE_PATTERN),
  }),
});

const workspaceProjectionResultSchema = z.object({
  data: z.object({ workspaceId: z.string().uuid(), applied: z.boolean() }),
});

const publicUpstreamErrorMessages: Readonly<Record<string, string>> = {
  form_limit_reached: "You have reached the free Forms limit. Upgrade at https://jobing.site/pricing?from=connector-limit to publish more forms, then retry this request.",
  idempotency_conflict: "This operation ID was already used with different input.",
  idempotency_in_progress: "The same Forms operation is already in progress.",
  insufficient_scope: "This connector has not been granted the required Forms permission.",
  invalid_payload: "The Forms request is invalid.",
  form_not_found: "The requested form could not be found.",
  stale_revision: "The form changed after it was read. Refresh it and try again.",
  response_not_found: "The requested form response could not be found.",
};

export type FormsActor = {
  userId: string;
  clientId: string;
  grantId: string;
  scopes: string[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function nativeFormHtml(definition: ConnectorFormDefinition, action: string) {
  const fields = definition.fields.filter((field) => !field.hidden).map((field) => {
    const name = escapeHtml(field.key);
    const label = escapeHtml(field.label);
    const required = field.required ? " required" : "";
    const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
    if (field.type === "textarea") return `  <label>${label}\n    <textarea name="${name}"${placeholder}${required}></textarea>\n  </label>`;
    if (field.type === "select") return `  <label>${label}\n    <select name="${name}"${required}>\n      <option value="">Choose one</option>\n${(field.options ?? []).map((option) => `      <option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("\n")}\n    </select>\n  </label>`;
    if (["radio", "checkbox"].includes(field.type)) return `  <fieldset>\n    <legend>${label}</legend>\n${(field.options ?? []).map((option) => `    <label><input type="${field.type}" name="${name}" value="${escapeHtml(option.value)}"${required}> ${escapeHtml(option.label)}</label>`).join("\n")}\n  </fieldset>`;
    if (field.type === "consent") return `  <label><input type="checkbox" name="${name}" value="yes"${required}> ${label}</label>`;
    if (field.type === "file") return `  <label>${label}\n    <input type="file" name="${name}"${required}${field.validation?.acceptedFileTypes?.length ? ` accept="${escapeHtml(field.validation.acceptedFileTypes.join(","))}"` : ""}>\n  </label>`;
    const type = ["email", "number", "tel", "url", "date"].includes(field.type) ? field.type : "text";
    return `  <label>${label}\n    <input type="${type}" name="${name}"${placeholder}${required}>\n  </label>`;
  }).join("\n\n");
  return `<form method="POST" enctype="multipart/form-data" action="${escapeHtml(action)}">\n${fields}\n\n  <div aria-hidden="true" style="position:absolute;left:-9999px">\n    <label>Leave this empty <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>\n  </div>\n  <button type="submit">Submit</button>\n</form>`;
}

export function publicFormsEndpointUrl(endpointId: string) {
  return `${PRODUCTION_FORMS_BASE_URL}/f/${encodeURIComponent(endpointId)}`;
}

function withPublicEndpoint<T extends { endpointId: string; definition?: unknown }>(form: T, suppliedDefinition?: ConnectorFormDefinition) {
  const endpointUrl = publicFormsEndpointUrl(form.endpointId);
  const definition = suppliedDefinition ?? form.definition as ConnectorFormDefinition;
  return {
    ...form,
    endpointUrl,
    integrationMode: "native_html_api" as const,
    iframeSupported: false as const,
    html: nativeFormHtml(definition, endpointUrl),
    integration: "Render the returned HTML as native page markup. Do not use an iframe. The page may freely customize the labels, layout and CSS, but must preserve the form action, POST method, and field name attributes.",
  };
}

function withoutDraftEndpoint<T extends { endpointId: string }>(form: T, definition?: ConnectorFormDefinition) {
  const draft = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "endpointId")) as Omit<T, "endpointId">;
  return { ...draft, publishRequired: true as const, integrationMode: "native_html_api" as const, iframeSupported: false as const, htmlTemplate: definition ? nativeFormHtml(definition, "{{JOBING_FORM_ACTION}}") : undefined };
}

export type ConnectorFormDefinition = {
  schemaVersion: 1;
  title: string;
  description?: string;
  fields: Array<{
    id: string;
    key: string;
    type: "text" | "email" | "textarea" | "number" | "tel" | "url" | "date" | "select" | "radio" | "checkbox" | "consent" | "file";
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    hidden?: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: {
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      acceptedFileTypes?: string[];
      maxFileSizeMb?: number;
    };
  }>;
  confirmation?: { title?: string; message: string; redirectUrl?: string };
  settings?: { allowedOrigins: string[] };
  presentation?: {
    colorMode: "dark" | "light";
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: "sans" | "serif" | "mono";
    spacing: "compact" | "comfortable" | "spacious";
    buttonStyle: "solid" | "outline";
  };
};

export type CreateConnectorFormInput = {
  name: string;
  description?: string;
  definition: ConnectorFormDefinition;
};

export type FormsWorkspaceProjection = {
  operationId: string;
  workspace: {
    sourceWorkspaceId: string;
    kind: "personal" | "team";
    displayName: string;
    status: "active" | "suspended" | "deleting" | "deleted";
    sourceVersion: number;
  };
  membership: {
    actorId: string;
    role: "owner" | "admin" | "editor" | "viewer";
    status: "active" | "removed";
    sourceVersion: number;
  };
  entitlement: {
    planKey: string;
    status: "active" | "grace" | "suspended" | "cancelled";
    sourceVersion: number;
    features: Record<string, unknown>;
    limits: Record<string, number | null>;
  };
};

export class FormsServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FormsServiceError";
  }
}

export function formsSignaturePayload(input: {
  method: string;
  path: string;
  timestamp: number;
  nonce: string;
  bodySha256: string;
}) {
  return ["v1", input.method.toUpperCase(), input.path, String(input.timestamp), input.nonce, input.bodySha256].join("\n");
}

export function signFormsRequest(secret: string, input: Parameters<typeof formsSignaturePayload>[0]) {
  return crypto.createHmac("sha256", secret).update(formsSignaturePayload(input)).digest("base64url");
}

function configurationError() {
  return new FormsServiceError("invalid_configuration", "Forms is not configured correctly.", 503);
}

function parseBaseUrl(value: string, allowLocalHttp: boolean) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw configurationError();
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(allowLocalHttp && isLocal && url.protocol === "http:")) {
    throw configurationError();
  }
  const pathname = url.pathname.replace(/\/+$/, "");
  if (
    url.username
    || url.password
    || url.search
    || url.hash
    || pathname !== "/forms"
  ) {
    throw configurationError();
  }
  return `${url.origin}${pathname}`;
}

function productionFormsBaseUrls() {
  const baseUrls = new Set([PRODUCTION_FORMS_BASE_URL]);
  const configured = process.env.FORMS_SERVICE_ALLOWED_BASE_URLS;
  if (!configured) return baseUrls;

  for (const entry of configured.split(",")) {
    const value = entry.trim();
    if (!value) throw configurationError();
    baseUrls.add(parseBaseUrl(value, false));
  }
  return baseUrls;
}

function formsBaseUrl() {
  const configured = process.env.FORMS_SERVICE_URL;
  if (!configured) throw new FormsServiceError("not_configured", "Forms is not configured for this deployment.", 503);
  const baseUrl = parseBaseUrl(configured, process.env.NODE_ENV !== "production");
  if (process.env.NODE_ENV === "production" && !productionFormsBaseUrls().has(baseUrl)) {
    throw configurationError();
  }
  return baseUrl;
}

function signingConfiguration() {
  const keyId = process.env.FORMS_INTERNAL_KEY_ID;
  const secret = process.env.FORMS_INTERNAL_SECRET;
  const secretBytes = secret ? Buffer.byteLength(secret, "utf8") : 0;
  if (
    !keyId
    || !KEY_ID_PATTERN.test(keyId)
    || !secret
    || secret.trim() !== secret
    || /[\u0000\r\n]/u.test(secret)
    || secretBytes < 32
    || secretBytes > 4_096
  ) {
    throw new FormsServiceError("not_configured", "Forms is not configured for this deployment.", 503);
  }
  return { keyId, secret };
}

function signatureHeaders(path: string, rawBody: string) {
  const { keyId, secret } = signingConfiguration();
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(24).toString("base64url");
  const bodySha256 = crypto.createHash("sha256").update(rawBody).digest("hex");
  const signature = signFormsRequest(secret, { method: "POST", path, timestamp, nonce, bodySha256 });

  return {
    "content-type": "application/json",
    accept: "application/json",
    "x-jobing-key-id": keyId,
    "x-jobing-timestamp": String(timestamp),
    "x-jobing-nonce": nonce,
    "x-jobing-content-sha256": bodySha256,
    "x-jobing-signature": `v1=${signature}`,
  };
}

class ResponsePayloadError extends Error {}

async function discardResponseBody(response: Response) {
  try {
    await response.body?.cancel();
  } catch {
    // A failed discard must not suppress status-based retry handling.
  }
}

async function readResponse(response: Response) {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && BigInt(declaredLength) > BigInt(MAX_RESPONSE_BYTES)) {
    await discardResponseBody(response);
    throw new ResponsePayloadError("too_large");
  }

  if (!response.body) throw new ResponsePayloadError("empty");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new ResponsePayloadError("too_large");
    }
    chunks.push(value);
  }

  if (total === 0) throw new ResponsePayloadError("empty");
  const raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total).toString("utf8");

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ResponsePayloadError("invalid_json");
  }
}

function serializeFormsPayload(payload: unknown) {
  let rawBody: string | undefined;
  try {
    rawBody = JSON.stringify(payload);
  } catch {
    throw new FormsServiceError("invalid_request", "The Forms request is invalid.", 400);
  }
  if (rawBody === undefined) {
    throw new FormsServiceError("invalid_request", "The Forms request is invalid.", 400);
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_FORMS_INTERNAL_REQUEST_BYTES) {
    throw new FormsServiceError("request_too_large", "The Forms request is too large.", 413);
  }
  return rawBody;
}

function requireOperationId(operationId: string) {
  if (!OPERATION_ID_PATTERN.test(operationId)) {
    throw new FormsServiceError("invalid_request", "A valid stable Forms operation ID is required.", 400);
  }
}

function parseServiceResponse<T>(schema: z.ZodType<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new FormsServiceError("invalid_response", "Forms returned an invalid response.", 502);
  }
  return parsed.data;
}

async function postSerializedToForms(path: string, rawBody: string) {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_FORMS_INTERNAL_REQUEST_BYTES) {
    throw new FormsServiceError("request_too_large", "The Forms request is too large.", 413);
  }
  const baseUrl = formsBaseUrl();
  const url = `${baseUrl}${path}`;
  const signedPath = `/forms${path}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const headers = signatureHeaders(signedPath, rawBody);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: rawBody,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      if (attempt === 0) continue;
      throw new FormsServiceError("service_unavailable", "Forms is temporarily unavailable.", 503);
    }

    if (response.status >= 500 && attempt === 0) {
      await discardResponseBody(response);
      continue;
    }

    let body: unknown;
    try {
      body = await readResponse(response);
    } catch (error) {
      if (!response.ok) {
        throw new FormsServiceError("request_failed", "Forms could not complete the request.", response.status);
      }
      if (!(error instanceof ResponsePayloadError) && attempt === 0) continue;
      throw new FormsServiceError("invalid_response", "Forms returned an invalid response.", 502);
    }

    if (!response.ok) {
      const parsed = errorEnvelopeSchema.safeParse(body);
      const code = parsed.success ? parsed.data.error.code : "request_failed";
      throw new FormsServiceError(
        code,
        publicUpstreamErrorMessages[code] ?? "Forms could not complete the request.",
        response.status,
      );
    }
    return body;
  }

  throw new FormsServiceError("service_unavailable", "Forms is temporarily unavailable.", 503);
}

async function postToForms(path: string, payload: unknown) {
  return postSerializedToForms(path, serializeFormsPayload(payload));
}

/**
 * Seed the user's personal Forms workspace before any connector operation.
 * The projection is monotonic and idempotent, so paid/team sync can supersede
 * this version later without a cross-database transaction.
 */
export async function ensureFormsWorkspace(actor: FormsActor) {
  return syncFormsWorkspaceProjection({
    operationId: `personal-workspace:${actor.userId}:v2`,
    workspace: {
      sourceWorkspaceId: actor.userId,
      kind: "personal",
      displayName: "Personal workspace",
      status: "active",
      sourceVersion: 2,
    },
    membership: {
      actorId: actor.userId,
      role: "owner",
      status: "active",
      sourceVersion: 2,
    },
    entitlement: {
      planKey: "free",
      status: "active",
      sourceVersion: 2,
      features: {},
      limits: {
        "forms.total": 5,
        "forms.published": 5,
      },
    },
  });
}

export async function syncFormsWorkspaceProjection(payload: FormsWorkspaceProjection) {
  requireOperationId(payload.operationId);
  const body = await postToForms("/api/internal/v1/workspaces/sync", payload);
  return parseServiceResponse(workspaceProjectionResultSchema, body).data;
}

export async function createConnectorForm(
  actor: FormsActor,
  form: CreateConnectorFormInput,
  operationId: string,
) {
  requireOperationId(operationId);
  const rawBody = serializeFormsPayload({ operationId, actor, form });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms("/api/internal/v1/forms", rawBody);
  return withoutDraftEndpoint(parseServiceResponse(z.object({ data: createdFormSchema }), body).data, form.definition);
}

export async function listConnectorForms(actor: FormsActor) {
  const rawBody = serializeFormsPayload({ actor });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms("/api/internal/v1/forms/list", rawBody);
  return parseServiceResponse(z.object({ data: z.object({ forms: z.array(formSummarySchema) }) }), body).data.forms.map((form) => form.status === "published" ? withPublicEndpoint(form) : withoutDraftEndpoint(form));
}

export async function publishConnectorForm(
  actor: FormsActor,
  formId: string,
  expectedRevision: number,
  operationId = `mcp:publish-form:${crypto.randomUUID()}`,
) {
  requireOperationId(operationId);
  const rawBody = serializeFormsPayload({
    operationId,
    actor,
    expectedRevision,
  });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms(`/api/internal/v1/forms/${encodeURIComponent(formId)}/publish`, rawBody);
  const published = parseServiceResponse(z.object({ data: publishedFormSchema }), body).data;
  const listed = (await listConnectorForms(actor)).find((form) => form.id === published.id);
  if (!listed?.definition) throw new FormsServiceError("invalid_response", "Forms returned an invalid response.", 502);
  return withPublicEndpoint({ ...published, definition: listed.definition });
}

export async function updateConnectorForm(
  actor: FormsActor,
  formId: string,
  input: {
    expectedRevision: number;
    name: string;
    description?: string;
    definition: ConnectorFormDefinition;
  },
) {
  const rawBody = serializeFormsPayload({ actor, ...input });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms(`/api/internal/v1/forms/${encodeURIComponent(formId)}/draft`, rawBody);
  const updated = parseServiceResponse(z.object({ data: updatedFormSchema }), body).data;
  return updated.status === "published"
    ? withPublicEndpoint(updated, input.definition)
    : withoutDraftEndpoint(updated, input.definition);
}

export async function duplicateConnectorForm(
  actor: FormsActor,
  sourceFormId: string,
  name: string,
  operationId: string,
) {
  const source = (await listConnectorForms(actor)).find((form) => form.id === sourceFormId);
  if (!source?.definition) throw new FormsServiceError("form_not_found", "The requested form could not be found.", 404);
  return createConnectorForm(actor, {
    name,
    definition: source.definition as ConnectorFormDefinition,
  }, operationId);
}

export async function listConnectorFormResponses(
  actor: FormsActor,
  formId: string,
  input: {
    query?: string;
    state?: "inbox" | "spam" | "archived";
    sort?: "newest" | "oldest";
    page?: number;
    pageSize?: number;
  },
) {
  const rawBody = serializeFormsPayload({ actor, ...input });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms(`/api/internal/v1/forms/${encodeURIComponent(formId)}/responses`, rawBody);
  return parseServiceResponse(z.object({ data: paginatedFormResponsesSchema }), body).data;
}

export async function setConnectorFormResponseState(
  actor: FormsActor,
  submissionId: string,
  state: "inbox" | "spam" | "archived",
) {
  const rawBody = serializeFormsPayload({ actor, state });
  await ensureFormsWorkspace(actor);
  const body = await postSerializedToForms(`/api/internal/v1/responses/${encodeURIComponent(submissionId)}/state`, rawBody);
  return parseServiceResponse(z.object({
    data: z.object({ submissionId: z.string().uuid(), state: z.enum(["inbox", "spam", "archived"]) }),
  }), body).data;
}
