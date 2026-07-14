const JSON_CONTENT_TYPE = /^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i;

export class SubmissionRequestError extends Error {
  constructor(public readonly code: "invalid_json" | "invalid_payload" | "request_too_large" | "unsupported_media_type") {
    super(code);
  }
}

function appendJsonValue(data: FormData, key: string, value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    data.append(key, String(value));
    return;
  }
  if (Array.isArray(value) && value.every((entry) => ["string", "number", "boolean"].includes(typeof entry))) {
    for (const entry of value) data.append(key, String(entry));
    return;
  }
  if (value !== null && value !== undefined) throw new SubmissionRequestError("invalid_payload");
}

async function readTextWithLimit(request: Request, maxBytes: number) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new SubmissionRequestError("request_too_large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function parseSubmissionRequest(request: Request, maxBytes = 256 * 1024) {
  const contentType = request.headers.get("content-type") ?? "";
  if (/^(?:multipart\/form-data|application\/x-www-form-urlencoded)(?:\s*;|$)/i.test(contentType)) {
    return { data: await request.formData(), isJson: false };
  }
  if (!JSON_CONTENT_TYPE.test(contentType)) throw new SubmissionRequestError("unsupported_media_type");

  let input: unknown;
  try {
    input = JSON.parse(await readTextWithLimit(request, maxBytes));
  } catch (error) {
    if (error instanceof SubmissionRequestError) throw error;
    throw new SubmissionRequestError("invalid_json");
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) throw new SubmissionRequestError("invalid_payload");
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > 120) throw new SubmissionRequestError("invalid_payload");

  const data = new FormData();
  for (const [key, value] of entries) {
    if (!key || key.length > 200 || ["__proto__", "constructor", "prototype"].includes(key)) throw new SubmissionRequestError("invalid_payload");
    appendJsonValue(data, key, value);
  }
  return { data, isJson: true };
}
