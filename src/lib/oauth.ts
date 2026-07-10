// OAuth 2.0 authorization server for the hosted MCP connector.
//
// Claude.ai (and Desktop/mobile/Cowork) connect to remote MCP servers from
// Anthropic's cloud and refuse user-pasted bearer headers, so an authenticated
// custom connector must implement OAuth. We support the "out of the box" path
// from the docs: Dynamic Client Registration (RFC 7591) + PKCE S256 + the
// authorization-code grant with refresh-token rotation.
//
// Everything here uses the Supabase service-role client (RLS bypassed) and
// stores only sha256 hashes of codes/tokens, mirroring src/lib/mcp-core.ts.

import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/* ------------------------------- Config ----------------------------------- */

export const SUPPORTED_SCOPES = ["mcp"] as const;
export const DEFAULT_SCOPE = "mcp";

const ACCESS_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CODE_TTL_SECONDS = 60 * 5; // 5 minutes

// Anthropic's hosted Claude surfaces all use this single redirect URI.
export const CLAUDE_REDIRECT_URI = "https://claude.ai/mcp/auth_callback";

/* ------------------------------- Helpers ---------------------------------- */

/** sha256 hex -- same scheme api_keys uses. */
export function sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function randomToken(prefix: string, bytes = 32): string {
    return `${prefix}${crypto.randomBytes(bytes).toString("base64url")}`;
}

/** Verify a PKCE code_verifier against a stored S256 challenge. */
export function verifyPkceS256(verifier: string, challenge: string): boolean {
    const computed = crypto.createHash("sha256").update(verifier).digest("base64url");
    // Constant-time compare on equal-length buffers.
    const a = Buffer.from(computed);
    const b = Buffer.from(challenge);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Public origin of this deployment, derived from the request so issuer/resource
 * URLs are correct on localhost, Vercel previews, and prod. Honors the proxy
 * forwarding headers Vercel sets.
 */
export function getBaseUrl(req: Request): string {
    const h = req.headers;
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
        const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
        return `${proto}://${host}`;
    }
    return new URL(req.url).origin;
}

/* --------------------------- Discovery metadata --------------------------- */

// `resource` MUST match the MCP URL exactly as the user types it in Claude,
// including the /mcp path. We build everything from the request origin so
// it is correct on localhost, preview, and prod without an env var.

export function protectedResourceMetadata(baseUrl: string) {
    return {
        resource: `${baseUrl}/mcp`,
        authorization_servers: [baseUrl],
        scopes_supported: [...SUPPORTED_SCOPES],
        bearer_methods_supported: ["header"],
        resource_name: "Jobing",
    };
}

export function authorizationServerMetadata(baseUrl: string) {
    return {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/api/oauth/token`,
        registration_endpoint: `${baseUrl}/api/oauth/register`,
        scopes_supported: [...SUPPORTED_SCOPES],
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        // Claude registers as a public client and authenticates at /token with
        // PKCE only (no client secret).
        token_endpoint_auth_methods_supported: ["none"],
        code_challenge_methods_supported: ["S256"],
    };
}

/* ---------------------- Dynamic Client Registration ----------------------- */

export interface RegisteredClient {
    client_id: string;
    redirect_uris: string[];
    client_name: string | null;
    token_endpoint_auth_method: string;
    created_at: string;
}

/**
 * Register a public OAuth client (RFC 7591). We only support public clients
 * (token_endpoint_auth_method "none" + PKCE), which is what Claude uses, so no
 * client secret is issued.
 */
export async function registerClient(input: {
    redirect_uris: string[];
    client_name?: string;
}): Promise<RegisteredClient> {
    const sb = getSupabaseAdmin();
    const client_id = randomToken("jbcl_", 16);

    const { data, error } = await sb
        .from("oauth_clients")
        .insert({
            client_id,
            redirect_uris: input.redirect_uris,
            client_name: input.client_name ?? null,
            token_endpoint_auth_method: "none",
        })
        .select("client_id, redirect_uris, client_name, token_endpoint_auth_method, created_at")
        .single();

    if (error || !data) {
        throw new Error(`Failed to register client: ${error?.message ?? "unknown"}`);
    }
    return data as RegisteredClient;
}

export async function getClient(clientId: string): Promise<RegisteredClient | null> {
    if (!clientId) return null;
    const sb = getSupabaseAdmin();
    const { data } = await sb
        .from("oauth_clients")
        .select("client_id, redirect_uris, client_name, token_endpoint_auth_method, created_at")
        .eq("client_id", clientId)
        .maybeSingle();
    return (data as RegisteredClient) ?? null;
}

/* --------------------------- Authorization codes -------------------------- */

/** Create a single-use authorization code bound to a user + PKCE challenge. */
export async function createAuthCode(input: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}): Promise<string> {
    const sb = getSupabaseAdmin();
    const code = randomToken("jbac_");
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();

    const { error } = await sb.from("oauth_auth_codes").insert({
        code_hash: sha256(code),
        client_id: input.clientId,
        user_id: input.userId,
        redirect_uri: input.redirectUri,
        scope: input.scope,
        code_challenge: input.codeChallenge,
        code_challenge_method: input.codeChallengeMethod,
        expires_at: expiresAt,
    });
    if (error) throw new Error(`Failed to create auth code: ${error.message}`);
    return code;
}

interface AuthCodeRow {
    client_id: string;
    user_id: string;
    redirect_uri: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: string;
    expires_at: string;
}

/** Atomically consume an auth code (delete-then-validate). Returns null if invalid/expired. */
export async function consumeAuthCode(code: string): Promise<AuthCodeRow | null> {
    if (!code) return null;
    const sb = getSupabaseAdmin();
    const codeHash = sha256(code);

    // Delete and return the row in one round-trip so a code can't be replayed.
    const { data } = await sb
        .from("oauth_auth_codes")
        .delete()
        .eq("code_hash", codeHash)
        .select("client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, expires_at")
        .maybeSingle();

    if (!data) return null;
    const row = data as AuthCodeRow;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    return row;
}

/* -------------------------------- Tokens ---------------------------------- */

export interface IssuedTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
}

export async function issueTokens(input: {
    clientId: string;
    userId: string;
    scope: string;
}): Promise<IssuedTokens> {
    const sb = getSupabaseAdmin();
    const accessToken = randomToken("jbat_");
    const refreshToken = randomToken("jbrt_");
    const now = Date.now();

    const { error } = await sb.from("oauth_tokens").insert({
        access_token_hash: sha256(accessToken),
        refresh_token_hash: sha256(refreshToken),
        client_id: input.clientId,
        user_id: input.userId,
        scope: input.scope,
        access_expires_at: new Date(now + ACCESS_TTL_SECONDS * 1000).toISOString(),
        refresh_expires_at: new Date(now + REFRESH_TTL_SECONDS * 1000).toISOString(),
    });
    if (error) throw new Error(`Failed to issue tokens: ${error.message}`);

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: ACCESS_TTL_SECONDS,
        scope: input.scope,
    };
}

/**
 * Refresh-token grant with rotation: the old refresh token is revoked and a
 * fresh access+refresh pair is issued. Public clients require rotation per the
 * MCP auth spec. Returns null when the refresh token is unknown/expired/revoked
 * (caller maps this to RFC 6749 `invalid_grant`).
 */
export async function rotateRefreshToken(input: {
    refreshToken: string;
    clientId: string;
}): Promise<IssuedTokens | null> {
    const sb = getSupabaseAdmin();
    const refreshHash = sha256(input.refreshToken);

    const { data } = await sb
        .from("oauth_tokens")
        .select("id, client_id, user_id, scope, refresh_expires_at, is_revoked")
        .eq("refresh_token_hash", refreshHash)
        .maybeSingle();

    if (!data || data.is_revoked) return null;
    if (data.client_id !== input.clientId) return null;
    if (!data.refresh_expires_at || new Date(data.refresh_expires_at).getTime() < Date.now()) return null;

    // Revoke the old row first (rotation), then mint a new pair.
    await sb.from("oauth_tokens").update({ is_revoked: true }).eq("id", data.id);

    return issueTokens({ clientId: data.client_id, userId: data.user_id, scope: data.scope });
}

/**
 * Resolve an OAuth access token to its Clerk user id, or null. Touched on the
 * hot path (every MCP call), so it's a single indexed hash lookup.
 */
export async function validateAccessToken(token: string | null | undefined): Promise<string | null> {
    if (!token || !token.startsWith("jbat_")) return null;
    const sb = getSupabaseAdmin();

    const { data } = await sb
        .from("oauth_tokens")
        .select("user_id, access_expires_at")
        .eq("access_token_hash", sha256(token))
        .eq("is_revoked", false)
        .maybeSingle();

    if (!data) return null;
    if (new Date(data.access_expires_at).getTime() < Date.now()) return null;
    return data.user_id;
}

