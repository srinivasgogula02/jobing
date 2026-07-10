import { NextRequest, NextResponse } from "next/server";
import { consumeAuthCode, issueTokens, rotateRefreshToken, verifyPkceS256 } from "@/lib/oauth";

// OAuth 2.0 token endpoint. Accepts application/x-www-form-urlencoded (required
// by RFC 6749 / the ChatGPT docs) and supports two grants:
//   - authorization_code (with PKCE S256)
//   - refresh_token       (with rotation)

export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
    // Must accept form-urlencoded; reject JSON-only callers cleanly.
    let form: URLSearchParams;
    try {
        const raw = await request.text();
        form = new URLSearchParams(raw);
    } catch {
        return oauthError("invalid_request", "Could not parse request body");
    }

    const grantType = form.get("grant_type");

    if (grantType === "authorization_code") {
        const code = form.get("code") ?? "";
        const redirectUri = form.get("redirect_uri") ?? "";
        const clientId = form.get("client_id") ?? "";
        const codeVerifier = form.get("code_verifier") ?? "";

        if (!code || !redirectUri || !clientId || !codeVerifier) {
            return oauthError("invalid_request", "Missing code, redirect_uri, client_id, or code_verifier");
        }

        const row = await consumeAuthCode(code);
        if (!row) return oauthError("invalid_grant", "Authorization code is invalid or expired");

        if (row.client_id !== clientId) return oauthError("invalid_grant", "client_id mismatch");
        if (row.redirect_uri !== redirectUri) return oauthError("invalid_grant", "redirect_uri mismatch");

        if (row.code_challenge_method !== "S256" || !verifyPkceS256(codeVerifier, row.code_challenge)) {
            return oauthError("invalid_grant", "PKCE verification failed");
        }

        try {
            const tokens = await issueTokens({ clientId: row.client_id, userId: row.user_id, scope: row.scope });
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
        if (!refreshToken || !clientId) {
            return oauthError("invalid_request", "Missing refresh_token or client_id");
        }

        try {
            const tokens = await rotateRefreshToken({ refreshToken, clientId });
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
            console.error("[oauth/token] refresh", err);
            return oauthError("server_error", undefined, 500);
        }
    }

    return oauthError("unsupported_grant_type", `grant_type "${grantType ?? ""}" is not supported`);
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

