import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth";
import {
    isAllowedOAuthRedirectUri,
    normalizeUntrustedClientName,
} from "@/lib/oauth-client-metadata";
import { rateLimit, requestIp } from "@/lib/rate-limit";

// RFC 7591 Dynamic Client Registration. AI clients POST metadata on a fresh
// connection and get back an issuer-bound client_id. We only issue public
// clients (PKCE, no secret).

export const dynamic = "force-dynamic";
const MAX_REGISTRATION_REQUEST_BYTES = 16 * 1024;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function registrationError(error: string, description: string, status = 400) {
    return NextResponse.json(
        { error, error_description: description },
        { status, headers: { ...CORS, "Cache-Control": "no-store" } },
    );
}

async function readBoundedJson(request: NextRequest): Promise<unknown> {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REGISTRATION_REQUEST_BYTES) {
        throw new Error("body_too_large");
    }

    if (!request.body) throw new Error("invalid_json");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (received > MAX_REGISTRATION_REQUEST_BYTES) {
                await reader.cancel();
                throw new Error("body_too_large");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
        throw new Error("invalid_json");
    }
}

function supportsOnly(
    value: unknown,
    allowed: readonly string[],
    required: readonly string[],
): boolean {
    if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string")) {
        return false;
    }
    const requested = new Set(value as string[]);
    return [...requested].every((item) => allowed.includes(item))
        && required.every((item) => requested.has(item));
}

export async function POST(request: NextRequest) {
    if (!rateLimit(`oauth-register:${requestIp(request)}`, 10, 60 * 60_000)) {
        return registrationError("rate_limit_exceeded", "Too many client registration requests", 429);
    }

    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType !== "application/json") {
        return registrationError("invalid_client_metadata", "Registration requests must use application/json");
    }

    let parsed: unknown;
    try {
        parsed = await readBoundedJson(request);
    } catch (error) {
        const description = error instanceof Error && error.message === "body_too_large"
            ? "Registration request body is too large"
            : "Body must be a JSON object";
        return registrationError("invalid_client_metadata", description);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return registrationError("invalid_client_metadata", "Body must be a JSON object");
    }
    const body = parsed as Record<string, unknown>;

    const redirectUris = body.redirect_uris;
    if (
        !Array.isArray(redirectUris)
        || redirectUris.length === 0
        || redirectUris.length > 10
        || !redirectUris.every(isAllowedOAuthRedirectUri)
    ) {
        return registrationError(
            "invalid_redirect_uri",
            "Provide 1-10 HTTPS or loopback redirect_uris without fragments or credentials",
        );
    }
    const cleaned = [...new Set(redirectUris as string[])];

    if (body.token_endpoint_auth_method !== undefined && body.token_endpoint_auth_method !== "none") {
        return registrationError("invalid_client_metadata", "Only public clients using token_endpoint_auth_method none are supported");
    }
    if (
        body.grant_types !== undefined
        && !supportsOnly(body.grant_types, ["authorization_code", "refresh_token"], ["authorization_code"])
    ) {
        return registrationError("invalid_client_metadata", "Only authorization_code and optional refresh_token grants are supported");
    }
    if (body.response_types !== undefined && !supportsOnly(body.response_types, ["code"], ["code"])) {
        return registrationError("invalid_client_metadata", "Only the code response type is supported");
    }
    if (body.client_name !== undefined && typeof body.client_name !== "string") {
        return registrationError("invalid_client_metadata", "client_name must be a string");
    }

    const clientName = normalizeUntrustedClientName(body.client_name) ?? undefined;
    if (typeof body.client_name === "string" && body.client_name.trim() && !clientName) {
        return registrationError("invalid_client_metadata", "client_name has no displayable characters");
    }

    try {
        const client = await registerClient({ redirect_uris: cleaned, client_name: clientName });
        return NextResponse.json(
            {
                client_id: client.client_id,
                redirect_uris: client.redirect_uris,
                client_name: client.client_name ?? undefined,
                token_endpoint_auth_method: "none",
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
                // Never expires; client_secret omitted (public client).
                client_id_issued_at: Math.floor(new Date(client.created_at).getTime() / 1000),
            },
            { status: 201, headers: { ...CORS, "Cache-Control": "no-store" } }
        );
    } catch (err) {
        console.error("[oauth/register]", err);
        return registrationError("server_error", "Client registration could not be completed", 500);
    }
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}
