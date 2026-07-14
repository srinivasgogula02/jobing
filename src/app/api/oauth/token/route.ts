import { NextRequest, NextResponse } from "next/server";
import {
    exchangeAuthorizationCode,
    getMcpResourceUrl,
    isValidPkceVerifier,
    rotateRefreshToken,
} from "@/lib/oauth";
import {
    InvalidOAuthScopeError,
    normalizeOptionalRequestedScopes,
} from "@/lib/oauth-scopes";
import { rateLimit, requestIp } from "@/lib/rate-limit";

// OAuth 2.0 token endpoint. Accepts application/x-www-form-urlencoded (required
// by RFC 6749 / the ChatGPT docs) and supports two grants:
//   - authorization_code (with PKCE S256)
//   - refresh_token       (with rotation)

export const dynamic = "force-dynamic";
const MAX_TOKEN_REQUEST_BYTES = 16 * 1024;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function oauthError(error: string, description?: string, status = 400) {
    return NextResponse.json(
        { error, ...(description ? { error_description: description } : {}) },
        { status, headers: { ...CORS, "Cache-Control": "no-store" } }
    );
}

function tokenResponse(body: unknown) {
    return NextResponse.json(body, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

async function readBoundedTokenBody(request: NextRequest) {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_TOKEN_REQUEST_BYTES) {
        throw new Error("body_too_large");
    }

    if (!request.body) return "";

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (received > MAX_TOKEN_REQUEST_BYTES) {
                await reader.cancel();
                throw new Error("body_too_large");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const body = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

export async function POST(request: NextRequest) {
    if (!rateLimit(`oauth-token:${requestIp(request)}`, 60, 60_000)) return oauthError("slow_down", "Too many token requests", 429);
    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType !== "application/x-www-form-urlencoded") {
        return oauthError("invalid_request", "Token requests must use application/x-www-form-urlencoded");
    }

    let form: URLSearchParams;
    try {
        const raw = await readBoundedTokenBody(request);
        form = new URLSearchParams(raw);
    } catch (error) {
        if (error instanceof Error && error.message === "body_too_large") {
            return oauthError("invalid_request", "Token request body is too large");
        }
        return oauthError("invalid_request", "Could not parse request body");
    }

    const grantType = form.get("grant_type");

    if (grantType === "authorization_code") {
        const code = form.get("code") ?? "";
        const redirectUri = form.get("redirect_uri") ?? "";
        const clientId = form.get("client_id") ?? "";
        const codeVerifier = form.get("code_verifier") ?? "";
        const expectedResource = getMcpResourceUrl(request);
        const resource = form.get("resource") || expectedResource;

        if (!code || !redirectUri || !clientId || !codeVerifier) {
            return oauthError("invalid_request", "Missing code, redirect_uri, client_id, or code_verifier");
        }
        if (!isValidPkceVerifier(codeVerifier)) return oauthError("invalid_grant", "PKCE verifier is invalid");
        if (resource !== expectedResource) return oauthError("invalid_target", "The requested resource is not supported");

        try {
            const tokens = await exchangeAuthorizationCode({ code, clientId, redirectUri, codeVerifier, resource });
            if (!tokens) return oauthError("invalid_grant", "Authorization code is invalid, expired, or does not match this request");
            return tokenResponse({
                access_token: tokens.access_token,
                token_type: "Bearer",
                expires_in: tokens.expires_in,
                refresh_token: tokens.refresh_token,
                scope: tokens.scope,
            });
        } catch (err) {
            console.error("[oauth/token] issue", err);
            return oauthError("server_error", undefined, 500);
        }
    }

    if (grantType === "refresh_token") {
        const refreshToken = form.get("refresh_token") ?? "";
        const clientId = form.get("client_id") ?? "";
        const expectedResource = getMcpResourceUrl(request);
        const resource = form.get("resource") || expectedResource;
        if (!refreshToken || !clientId) {
            return oauthError("invalid_request", "Missing refresh_token or client_id");
        }
        if (resource !== expectedResource) return oauthError("invalid_target", "The requested resource is not supported");

        try {
            const requestedScopes = normalizeOptionalRequestedScopes(form.get("scope"));
            const tokens = await rotateRefreshToken({ refreshToken, clientId, resource, requestedScopes });
            // RFC 6749: signal a dead refresh token with invalid_grant so ChatGPT
            // re-runs the full OAuth flow instead of looping.
            if (!tokens) return oauthError("invalid_grant", "Refresh token is invalid or expired");
            return tokenResponse({
                access_token: tokens.access_token,
                token_type: "Bearer",
                expires_in: tokens.expires_in,
                refresh_token: tokens.refresh_token,
                scope: tokens.scope,
            });
        } catch (err) {
            if (err instanceof InvalidOAuthScopeError) return oauthError("invalid_scope", err.message);
            console.error("[oauth/token] refresh", err);
            return oauthError("server_error", undefined, 500);
        }
    }

    return oauthError("unsupported_grant_type", `grant_type "${grantType ?? ""}" is not supported`);
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}
