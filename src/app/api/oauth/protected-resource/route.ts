import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, protectedResourceMetadata } from "@/lib/oauth";

// RFC 9728 Protected Resource Metadata. Served (via next.config rewrites) at
// /.well-known/oauth-protected-resource and the path-suffixed variant
// /.well-known/oauth-protected-resource/mcp, which ChatGPT probes first.

export const dynamic = "force-dynamic";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function GET(request: NextRequest) {
    return NextResponse.json(protectedResourceMetadata(getBaseUrl(request)), { headers: CORS });
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

