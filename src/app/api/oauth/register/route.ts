import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth";

// RFC 7591 Dynamic Client Registration. ChatGPT POSTs its client metadata
// (application/json) on a fresh connection and gets back a client_id. We only
// issue public clients (PKCE, no secret), which is what ChatGPT uses.

export const dynamic = "force-dynamic";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function isHttpsOrLoopback(uri: string): boolean {
    try {
        const u = new URL(uri);
        if (u.protocol === "https:") return true;
        // RFC 8252 native loopback redirects.
        return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]");
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "invalid_client_metadata", error_description: "Body must be JSON" },
            { status: 400, headers: CORS }
        );
    }

    const redirectUris = Array.isArray(body.redirect_uris) ? (body.redirect_uris as unknown[]) : [];
    const cleaned = redirectUris.filter((u): u is string => typeof u === "string" && isHttpsOrLoopback(u));

    if (cleaned.length === 0) {
        return NextResponse.json(
            { error: "invalid_redirect_uri", error_description: "At least one https or loopback redirect_uri is required" },
            { status: 400, headers: CORS }
        );
    }

    const clientName = typeof body.client_name === "string" ? body.client_name : undefined;

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
            { status: 201, headers: CORS }
        );
    } catch (err) {
        console.error("[oauth/register]", err);
        return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
    }
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

