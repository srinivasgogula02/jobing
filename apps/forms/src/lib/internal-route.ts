import { NextResponse } from "next/server";
import type { z } from "zod";
import { claimRequestNonce } from "@/lib/forms-store";
import { InternalAuthError, verifyInternalSignature } from "@/lib/internal-auth";

const MAX_INTERNAL_BODY_BYTES = 256 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export class InternalRouteError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "InternalRouteError";
  }
}

async function readBoundedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_INTERNAL_BODY_BYTES) {
    throw new InternalRouteError(413, "body_too_large", "The internal request body is too large.");
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_INTERNAL_BODY_BYTES) {
      await reader.cancel();
      throw new InternalRouteError(413, "body_too_large", "The internal request body is too large.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

export async function readInternalJson<T>(request: Request, schema: z.ZodType<T>, signedPath: string) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new InternalRouteError(415, "unsupported_media_type", "The internal request body must be JSON.");
  }
  const rawBody = await readBoundedBody(request);

  const signature = verifyInternalSignature({
    method: request.method,
    path: signedPath,
    rawBody,
    headers: request.headers,
  });

  const claimed = await claimRequestNonce(
    signature.keyId,
    signature.nonce,
    new Date((signature.timestamp + 10 * 60) * 1000),
  );
  if (!claimed) throw new InternalRouteError(409, "replayed_request", "The internal request nonce was already used.");

  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new InternalRouteError(400, "invalid_json", "The internal request body is not valid JSON.");
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new InternalRouteError(422, "invalid_payload", "The internal request payload is invalid.");
  }
  return { data: parsed.data, rawBody };
}

export function requireInternalScope(actor: { scopes: string[] }, ...acceptedScopes: string[]) {
  if (acceptedScopes.some((scope) => actor.scopes.includes(scope))) return;
  throw new InternalRouteError(403, "insufficient_scope", "The connected account has not granted the required Forms permission.");
}

export function internalDataResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status, headers: NO_STORE_HEADERS });
}

export function internalErrorResponse(error: unknown) {
  if (error instanceof InternalRouteError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers: NO_STORE_HEADERS },
    );
  }
  if (error instanceof InternalAuthError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const message = error instanceof Error ? error.message : "";
  const known = ["FORBIDDEN", "FORM_LIMIT_REACHED", "IDEMPOTENCY_CONFLICT", "IDEMPOTENCY_IN_PROGRESS", "STALE_REVISION", "FORM_NOT_FOUND"];
  const code = known.find((candidate) => message.includes(candidate));
  if (code) {
    const status = code === "FORBIDDEN" ? 403 : code === "FORM_NOT_FOUND" ? 404 : code === "FORM_LIMIT_REACHED" ? 402 : 409;
    return NextResponse.json(
      { error: { code: code.toLowerCase(), message: "The Forms operation could not be completed." } },
      { status, headers: NO_STORE_HEADERS },
    );
  }

  console.error("[forms/internal] operation failed", error instanceof Error ? { name: error.name, code: (error as { code?: string }).code } : { type: typeof error });
  return NextResponse.json(
    { error: { code: "internal_error", message: "The Forms service could not complete the request." } },
    { status: 500, headers: NO_STORE_HEADERS },
  );
}
