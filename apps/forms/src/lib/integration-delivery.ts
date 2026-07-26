import "server-only";

import { createHash, createHmac, createSign } from "node:crypto";
import { z } from "zod";
import { decryptIntegrationSecret } from "@/lib/integration-crypto";
import {
  integrationProviderSchema,
  parseIntegrationConfig,
  parseIntegrationSecret,
  type IntegrationProvider,
} from "@/lib/integration-definition";
import { integrationHttpRequest, type IntegrationHttpResponse } from "@/lib/integration-http";
import { captureFormsIntegrationError } from "@/lib/server-telemetry";

const integrationDeliverySchema = z.object({
  deliveryId: z.string().uuid(),
  integrationId: z.string().uuid(),
  provider: integrationProviderSchema,
  config: z.record(z.string(), z.unknown()),
  secretCiphertext: z.string().nullable(),
  secretKeyId: z.string().nullable(),
  attempt: z.coerce.number().int().positive(),
  form: z.object({ id: z.string().uuid(), name: z.string() }),
  submission: z.object({
    id: z.string().uuid(),
    receivedAt: z.string(),
    values: z.record(z.string(), z.unknown()),
    origin: z.string().nullable(),
  }),
});

export type IntegrationDelivery = z.infer<typeof integrationDeliverySchema>;

export const integrationSubmissionFileSchema = z.object({
  id: z.string().uuid(),
  fieldKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  byteSize: z.coerce.number().int().positive(),
  scanStatus: z.enum(["unscanned", "clean"]),
  contentBase64: z.string(),
});

export type IntegrationSubmissionFile = z.infer<typeof integrationSubmissionFileSchema>;

export type DeliveryOutcome = {
  success: boolean;
  status: number | null;
  code: string | null;
  retryable: boolean;
};

function stringValue(value: unknown) {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(", ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function responseLines(delivery: IntegrationDelivery) {
  return Object.entries(delivery.submission.values).map(([key, value]) => ({
    key,
    value: stringValue(value).slice(0, 4_000),
  }));
}

function payload(delivery: IntegrationDelivery, eventName = "form.response.created") {
  return {
    event: eventName,
    id: delivery.deliveryId,
    createdAt: delivery.submission.receivedAt,
    form: delivery.form,
    response: {
      id: delivery.submission.id,
      submittedAt: delivery.submission.receivedAt,
      values: delivery.submission.values,
    },
  };
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function result(response: IntegrationHttpResponse): DeliveryOutcome {
  const success = response.status >= 200 && response.status < 300;
  return {
    success,
    status: response.status,
    code: success ? null : `provider_http_${response.status}`,
    retryable: response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500,
  };
}

async function jsonRequest(input: {
  method?: "POST" | "PUT" | "PATCH";
  url: string;
  value: unknown;
  headers?: Record<string, string>;
  allowedHosts?: readonly string[];
}) {
  return integrationHttpRequest({
    method: input.method ?? "POST",
    url: input.url,
    body: JSON.stringify(input.value),
    allowedHosts: input.allowedHosts,
    headers: { "content-type": "application/json", ...input.headers },
  });
}

function requireSecret(delivery: IntegrationDelivery) {
  if (!delivery.secretCiphertext || !delivery.secretKeyId) throw new Error("INTEGRATION_SECRET_MISSING");
  try {
    const decrypted = decryptIntegrationSecret(delivery.secretKeyId, delivery.secretCiphertext);
    return parseIntegrationSecret(delivery.provider, decrypted) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && /^[A-Z0-9_]+$/u.test(error.message)) throw error;
    throw new Error("INTEGRATION_SECRET_INVALID");
  }
}

function mappedFields(values: Record<string, unknown>, mappings: Record<string, string>) {
  const entries = Object.entries(mappings).length
    ? Object.entries(mappings).map(([source, target]) => [target, values[source]])
    : Object.entries(values);
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined).map(([key, value]) => [key, stringValue(value)]));
}

async function deliverEmail(delivery: IntegrationDelivery) {
  const config = parseIntegrationConfig("email", delivery.config) as { recipients: string[]; subject: string };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FORMS_NOTIFICATION_FROM;
  if (!apiKey || !from) throw new Error("EMAIL_INTEGRATION_NOT_CONFIGURED");
  const rows = responseLines(delivery)
    .map(({ key, value }) => `<tr><th style="padding:8px;text-align:left;vertical-align:top">${htmlEscape(key.replaceAll("_", " "))}</th><td style="padding:8px">${htmlEscape(value || "Not answered")}</td></tr>`)
    .join("");
  const subject = config.subject.replaceAll("{{form_name}}", delivery.form.name);
  return result(await jsonRequest({
    url: "https://api.resend.com/emails",
    allowedHosts: ["api.resend.com"],
    headers: { authorization: `Bearer ${apiKey}` },
    value: {
      from,
      to: config.recipients,
      subject,
      html: `<h2>${htmlEscape(delivery.form.name)}</h2><p>New response received ${htmlEscape(delivery.submission.receivedAt)}.</p><table>${rows}</table>`,
    },
  }));
}

async function deliverSlack(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("slack", delivery.config) as { title: string };
  const fields = responseLines(delivery).slice(0, 20).map(({ key, value }) => ({
    type: "plain_text",
    text: `${key.replaceAll("_", " ")}\n${value || "Not answered"}`.slice(0, 1_900),
  }));
  return result(await jsonRequest({
    url: String(secret.webhookUrl),
    allowedHosts: ["hooks.slack.com", "hooks.slack-gov.com"],
    value: {
      text: `${config.title}: ${delivery.form.name}`,
      blocks: [
        { type: "header", text: { type: "plain_text", text: config.title } },
        { type: "section", text: { type: "mrkdwn", text: `*${delivery.form.name}* received a response.` } },
        { type: "section", fields },
      ],
    },
  }));
}

async function deliverLark(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("lark", delivery.config) as { title: string };
  const content = responseLines(delivery).slice(0, 30).map(({ key, value }) => `${key.replaceAll("_", " ")}: ${value || "Not answered"}`).join("\n").slice(0, 3_500);
  return result(await jsonRequest({
    url: String(secret.webhookUrl),
    allowedHosts: ["open.larksuite.com", "open.feishu.cn"],
    value: {
      msg_type: "interactive",
      card: {
        header: { title: { tag: "plain_text", content: config.title } },
        elements: [{ tag: "div", text: { tag: "plain_text", content: `${delivery.form.name}\n${content}` } }],
      },
    },
  }));
}

async function deliverTelegram(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("telegram", delivery.config) as { chatId: string; threadId?: string };
  const text = [`New response: ${delivery.form.name}`, ...responseLines(delivery).slice(0, 25).map(({ key, value }) => `${key.replaceAll("_", " ")}: ${value || "Not answered"}`)].join("\n").slice(0, 4_000);
  const token = String(secret.botToken);
  return result(await jsonRequest({
    url: `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
    allowedHosts: ["api.telegram.org"],
    value: {
      chat_id: config.chatId,
      text,
      ...(config.threadId ? { message_thread_id: config.threadId } : {}),
      disable_web_page_preview: true,
    },
  }));
}

async function deliverWebhook(delivery: IntegrationDelivery, secret: Record<string, unknown>, provider: "webhook" | "zapier") {
  const config = parseIntegrationConfig(provider, delivery.config) as { eventName: string };
  const body = JSON.stringify(payload(delivery, config.eventName));
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-jobing-event": config.eventName,
    "x-jobing-delivery": delivery.deliveryId,
  };
  if (provider === "webhook") {
    const timestamp = Math.floor(Date.now() / 1_000);
    headers["x-jobing-timestamp"] = String(timestamp);
    headers["x-jobing-signature"] = `t=${timestamp},v1=${createHmac("sha256", String(secret.signingSecret)).update(`${timestamp}.${body}`).digest("hex")}`;
  }
  return result(await integrationHttpRequest({
    method: "POST",
    url: String(secret.webhookUrl),
    body,
    headers,
    ...(provider === "zapier" ? { allowedHosts: ["hooks.zapier.com"] } : {}),
  }));
}

async function deliverAirtable(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("airtable", delivery.config) as { baseId: string; tableId: string; fieldMappings: Record<string, string> };
  return result(await jsonRequest({
    url: `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.tableId)}`,
    allowedHosts: ["api.airtable.com"],
    headers: { authorization: `Bearer ${String(secret.accessToken)}` },
    value: { records: [{ fields: mappedFields(delivery.submission.values, config.fieldMappings) }], typecast: true },
  }));
}

const serviceAccountSchema = z.object({
  client_email: z.string().email(),
  private_key: z.string().min(100),
  token_uri: z.literal("https://oauth2.googleapis.com/token").default("https://oauth2.googleapis.com/token"),
});

async function googleAccessToken(serviceAccountJson: string, scope: string) {
  const account = serviceAccountSchema.parse(JSON.parse(serviceAccountJson));
  const now = Math.floor(Date.now() / 1_000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: account.client_email,
    scope,
    aud: account.token_uri,
    iat: now,
    exp: now + 3_000,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key).toString("base64url")}`;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();
  const response = await integrationHttpRequest({
    method: "POST",
    url: account.token_uri,
    allowedHosts: ["oauth2.googleapis.com"],
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  if (response.status < 200 || response.status >= 300) throw new Error(`GOOGLE_AUTH_HTTP_${response.status}`);
  return z.object({ access_token: z.string().min(10) }).parse(JSON.parse(response.body)).access_token;
}

async function deliverGoogleSheets(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("google_sheets", delivery.config) as { spreadsheetId: string; sheetName: string; fieldOrder: string[] };
  const token = await googleAccessToken(String(secret.serviceAccountJson), "https://www.googleapis.com/auth/spreadsheets");
  const order = config.fieldOrder.length ? config.fieldOrder : Object.keys(delivery.submission.values);
  return result(await jsonRequest({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(`${config.sheetName}!A:ZZ`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    allowedHosts: ["sheets.googleapis.com"],
    headers: { authorization: `Bearer ${token}` },
    value: { values: [[delivery.submission.receivedAt, delivery.submission.id, ...order.map((field) => stringValue(delivery.submission.values[field]))]] },
  }));
}

function driveMultipart(metadata: Record<string, unknown>, contentType: string, content: Buffer) {
  const boundary = `jobing_${createHash("sha256").update(JSON.stringify(metadata)).digest("hex").slice(0, 24)}`;
  return {
    contentType: `multipart/related; boundary=${boundary}`,
    body: Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`, "utf8"),
      content,
      Buffer.from(`\r\n--${boundary}--`, "utf8"),
    ]),
  };
}

async function uploadDriveFile(token: string, folderId: string, name: string, contentType: string, content: Buffer, appProperties: Record<string, string>) {
  const multipart = driveMultipart({ name, parents: [folderId], appProperties }, contentType, content);
  return result(await integrationHttpRequest({
    method: "POST",
    url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    allowedHosts: ["www.googleapis.com"],
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": multipart.contentType,
    },
    body: multipart.body,
  }));
}

async function deliverGoogleDrive(delivery: IntegrationDelivery, secret: Record<string, unknown>, files: IntegrationSubmissionFile[]) {
  const config = parseIntegrationConfig("google_drive", delivery.config) as { folderId: string; includeResponseSummary: boolean };
  const token = await googleAccessToken(String(secret.serviceAccountJson), "https://www.googleapis.com/auth/drive.file");
  const outcomes: DeliveryOutcome[] = [];
  if (config.includeResponseSummary) {
    const summary = Buffer.from(JSON.stringify(payload(delivery), null, 2), "utf8");
    outcomes.push(await uploadDriveFile(token, config.folderId, `${delivery.form.name}-${delivery.submission.id}.json`, "application/json", summary, {
      jobingSubmissionId: delivery.submission.id,
      jobingFieldKey: "_summary",
    }));
  }
  for (const file of files) {
    outcomes.push(await uploadDriveFile(token, config.folderId, `${delivery.submission.id}-${file.fileName}`, file.contentType, Buffer.from(file.contentBase64, "base64"), {
      jobingSubmissionId: delivery.submission.id,
      jobingFieldKey: file.fieldKey,
    }));
  }
  return outcomes.find((outcome) => !outcome.success) ?? { success: true, status: 200, code: null, retryable: false };
}

async function deliverHubSpot(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("hubspot", delivery.config) as {
    emailField: string;
    firstNameField?: string;
    lastNameField?: string;
    phoneField?: string;
    companyField?: string;
    jobTitleField?: string;
  };
  const values = delivery.submission.values;
  const properties: Record<string, string> = { email: stringValue(values[config.emailField]) };
  const mappings: Array<[string, string | undefined]> = [
    ["firstname", config.firstNameField],
    ["lastname", config.lastNameField],
    ["phone", config.phoneField],
    ["company", config.companyField],
    ["jobtitle", config.jobTitleField],
  ];
  for (const [target, source] of mappings) if (source && values[source] !== undefined) properties[target] = stringValue(values[source]);
  const headers = { authorization: `Bearer ${String(secret.accessToken)}` };
  const create = await jsonRequest({
    url: "https://api.hubapi.com/crm/v3/objects/contacts",
    allowedHosts: ["api.hubapi.com"],
    headers,
    value: { properties },
  });
  if (create.status !== 409) return result(create);
  return result(await jsonRequest({
    method: "PATCH",
    url: `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`,
    allowedHosts: ["api.hubapi.com"],
    headers,
    value: { properties },
  }));
}

async function deliverMailchimp(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("mailchimp", delivery.config) as {
    audienceId: string;
    emailField: string;
    firstNameField?: string;
    lastNameField?: string;
    tags: string[];
  };
  const apiKey = String(secret.apiKey);
  const dataCenter = apiKey.split("-").at(-1);
  if (!dataCenter || !/^us\d+$/u.test(dataCenter)) throw new Error("MAILCHIMP_API_KEY_INVALID");
  const email = stringValue(delivery.submission.values[config.emailField]).trim().toLowerCase();
  const subscriberHash = createHash("md5").update(email).digest("hex");
  return result(await jsonRequest({
    method: "PUT",
    url: `https://${dataCenter}.api.mailchimp.com/3.0/lists/${encodeURIComponent(config.audienceId)}/members/${subscriberHash}`,
    allowedHosts: [`${dataCenter}.api.mailchimp.com`],
    headers: { authorization: `Basic ${Buffer.from(`jobing:${apiKey}`).toString("base64")}` },
    value: {
      email_address: email,
      status_if_new: "subscribed",
      status: "subscribed",
      merge_fields: {
        ...(config.firstNameField ? { FNAME: stringValue(delivery.submission.values[config.firstNameField]) } : {}),
        ...(config.lastNameField ? { LNAME: stringValue(delivery.submission.values[config.lastNameField]) } : {}),
      },
      tags: config.tags,
    },
  }));
}

async function deliverNotion(delivery: IntegrationDelivery, secret: Record<string, unknown>) {
  const config = parseIntegrationConfig("notion", delivery.config) as {
    databaseId: string;
    titleProperty: string;
    titleField: string;
    fieldMappings: Record<string, string>;
  };
  const properties: Record<string, unknown> = {
    [config.titleProperty]: {
      title: [{ type: "text", text: { content: stringValue(delivery.submission.values[config.titleField]).slice(0, 2_000) || "Form response" } }],
    },
  };
  for (const [source, target] of Object.entries(config.fieldMappings)) {
    if (target === config.titleProperty || delivery.submission.values[source] === undefined) continue;
    properties[target] = {
      rich_text: [{ type: "text", text: { content: stringValue(delivery.submission.values[source]).slice(0, 2_000) } }],
    };
  }
  return result(await jsonRequest({
    url: "https://api.notion.com/v1/pages",
    allowedHosts: ["api.notion.com"],
    headers: {
      authorization: `Bearer ${String(secret.accessToken)}`,
      "notion-version": "2022-06-28",
    },
    value: { parent: { database_id: config.databaseId }, properties },
  }));
}

export function parseIntegrationDelivery(value: unknown) {
  return integrationDeliverySchema.parse(value);
}

function integrationErrorCode(error: unknown) {
  if (error instanceof z.ZodError) return "integration_configuration_invalid";
  if (error instanceof Error && /^[A-Z0-9_]+$/u.test(error.message)) return error.message.toLowerCase();
  if (error instanceof Error && error.message.startsWith("GOOGLE_AUTH_HTTP_")) return error.message.toLowerCase();

  const networkCode = typeof error === "object" && error !== null && "code" in error
    ? String(error.code).toUpperCase()
    : "";
  if (networkCode === "ENOTFOUND" || networkCode === "EAI_AGAIN") return "integration_dns_failed";
  if (networkCode === "ECONNREFUSED") return "integration_connection_refused";
  if (networkCode === "ECONNRESET" || networkCode === "EPIPE") return "integration_connection_interrupted";
  if (
    networkCode.startsWith("CERT_")
    || networkCode.startsWith("ERR_TLS_")
    || networkCode === "DEPTH_ZERO_SELF_SIGNED_CERT"
    || networkCode === "SELF_SIGNED_CERT_IN_CHAIN"
    || networkCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ) return "integration_tls_failed";
  return "integration_request_failed";
}

export async function deliverIntegration(
  deliveryValue: unknown,
  files: IntegrationSubmissionFile[] = [],
): Promise<DeliveryOutcome> {
  const delivery = parseIntegrationDelivery(deliveryValue);
  if (delivery.provider === "google_analytics" || delivery.provider === "facebook_pixel") {
    return { success: true, status: null, code: null, retryable: false };
  }

  try {
    if (delivery.provider === "email") return await deliverEmail(delivery);
    const secret = requireSecret(delivery);
    switch (delivery.provider as IntegrationProvider) {
      case "slack": return await deliverSlack(delivery, secret);
      case "lark": return await deliverLark(delivery, secret);
      case "telegram": return await deliverTelegram(delivery, secret);
      case "webhook": return await deliverWebhook(delivery, secret, "webhook");
      case "zapier": return await deliverWebhook(delivery, secret, "zapier");
      case "airtable": return await deliverAirtable(delivery, secret);
      case "google_sheets": return await deliverGoogleSheets(delivery, secret);
      case "google_drive": return await deliverGoogleDrive(delivery, secret, files);
      case "hubspot": return await deliverHubSpot(delivery, secret);
      case "mailchimp": return await deliverMailchimp(delivery, secret);
      case "notion": return await deliverNotion(delivery, secret);
      default: return { success: false, status: null, code: "provider_not_supported", retryable: false };
    }
  } catch (error) {
    const code = integrationErrorCode(error);
    if (code === "integration_request_failed") {
      captureFormsIntegrationError(error, {
        provider: delivery.provider,
        code,
        attempt: delivery.attempt,
      });
    }
    const retryable = code.includes("timeout")
      || code.includes("unavailable")
      || code.includes("request_failed")
      || code.includes("dns_failed")
      || code.includes("connection_interrupted")
      || code.includes("google_auth_http_5");
    return { success: false, status: null, code: code.slice(0, 100), retryable };
  }
}
