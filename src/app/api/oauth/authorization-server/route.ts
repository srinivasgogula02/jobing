import { NextRequest, NextResponse } from "next/server";
import { authorizationServerMetadata, getBaseUrl } from "@/lib/oauth";

// RFC 8414 Authorization Server Metadata. Served (via next.config rewrites) at
// /.well-known/oauth-authorization-server. ChatGPT reads this after the
// protected-resource document to find /authorize, /token, and /register.

export const dynamic = "force-dynamic";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function GET(request: NextRequest) {
    return NextResponse.json(authorizationServerMetadata(getBaseUrl(request)), { headers: CORS });
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

