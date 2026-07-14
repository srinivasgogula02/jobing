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
import { oauthClientDisplayIdentity } from "@/lib/oauth-client-metadata";
import {
    OAUTH_SCOPES,
    effectiveOAuthScopes,
    serializeOAuthScopes,
    type OAuthScope,
} from "@/lib/oauth-scopes";

/* ------------------------------- Config ----------------------------------- */

export const SUPPORTED_SCOPES = OAUTH_SCOPES;
export const DEFAULT_SCOPE = serializeOAuthScopes(OAUTH_SCOPES);

const ACCESS_TTL_SECONDS = 60 * 60; // 1 hour
const CODE_TTL_SECONDS = 60 * 5; // 5 minutes

// Anthropic's hosted Claude surfaces all use this single redirect URI.
export const CLAUDE_REDIRECT_URI = "https://claude.ai/mcp/auth_callback";

/* ------------------------------- Helpers ---------------------------------- */

/** sha256 hex -- same scheme api_keys uses. */
export function sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
}

export function pkceS256Challenge(verifier: string): string {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function isValidPkceS256Challenge(challenge: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(challenge);
}

export function isValidPkceVerifier(verifier: string): boolean {
    return /^[A-Za-z0-9._~-]{43,128}$/.test(verifier);
}

function randomToken(prefix: string, bytes = 32): string {
    return `${prefix}${crypto.randomBytes(bytes).toString("base64url")}`;
}

/** Verify a PKCE code_verifier against a stored S256 challenge. */
export function verifyPkceS256(verifier: string, challenge: string): boolean {
    const computed = pkceS256Challenge(verifier);
    // Constant-time compare on equal-length buffers.
    const a = Buffer.from(computed);
    const b = Buffer.from(challenge);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function configuredIssuer(): string {
    const value = process.env.OAUTH_ISSUER;
    if (!value) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("OAUTH_ISSUER is required outside local development");
        }
        return "http://localhost:3000";
    }
    const url = new URL(value);
    const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) {
        throw new Error("OAUTH_ISSUER must use HTTPS (HTTP is allowed only for local development)");
    }
    if (url.username || url.password || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
        throw new Error("OAUTH_ISSUER must be an origin without credentials, a path, query, or fragment");
    }
    return url.origin;
}

/**
 * Return the canonical OAuth issuer. Production discovery must never reflect a
 * caller-controlled Host or X-Forwarded-Host header. Local development uses
 * the fixed http://localhost:3000 default unless OAUTH_ISSUER is set.
 */
export function getBaseUrl(req: Request): string {
    void req;
    return configuredIssuer();
}

export function getMcpResourceUrl(req?: Request): string {
    return `${req ? getBaseUrl(req) : configuredIssuer()}/mcp`;
}

/* --------------------------- Discovery metadata --------------------------- */

// `resource` MUST match the MCP URL exactly as the user types it, including
// `/mcp`. Every surface uses the same configured canonical issuer.

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
    issuer: string;
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
    const issuer = configuredIssuer();

    const { data, error } = await sb
        .from("oauth_clients")
        .insert({
            client_id,
            issuer,
            redirect_uris: input.redirect_uris,
            client_name: input.client_name ?? null,
            token_endpoint_auth_method: "none",
        })
        .select("client_id, issuer, redirect_uris, client_name, token_endpoint_auth_method, created_at")
        .single();

    if (error || !data) {
        throw new Error(`Failed to register client: ${error?.message ?? "unknown"}`);
    }
    return data as RegisteredClient;
}

export async function getClient(clientId: string): Promise<RegisteredClient | null> {
    if (!clientId) return null;
    const sb = getSupabaseAdmin();
    const issuer = configuredIssuer();
    const { data } = await sb
        .from("oauth_clients")
        .select("client_id, issuer, redirect_uris, client_name, token_endpoint_auth_method, created_at")
        .eq("client_id", clientId)
        .eq("issuer", issuer)
        .maybeSingle();
    if (!data || data.issuer !== issuer) return null;
    return data as RegisteredClient;
}

/* --------------------------- Authorization codes -------------------------- */

/** Create a single-use authorization code bound to a user + PKCE challenge. */
export async function createAuthCode(input: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    resource: string;
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
        resource: input.resource,
        code_challenge: input.codeChallenge,
        code_challenge_method: input.codeChallengeMethod,
        expires_at: expiresAt,
    });
    if (error) throw new Error(`Failed to create auth code: ${error.message}`);
    return code;
}

/* -------------------------------- Tokens ---------------------------------- */

export interface IssuedTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    grant_id: string;
}

interface TokenRpcResult {
    scope: string;
    grant_id: string;
}

interface AccessTokenRpcResult {
    user_id: string;
    client_id: string;
    scope: string;
    grant_id: string;
    access_expires_at: string;
}

function tokenRpcResult(value: unknown): TokenRpcResult | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (typeof row.scope !== "string" || typeof row.grant_id !== "string") return null;
    return { scope: row.scope, grant_id: row.grant_id };
}

function accessTokenRpcResult(value: unknown): AccessTokenRpcResult | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (
        typeof row.user_id !== "string"
        || typeof row.client_id !== "string"
        || typeof row.scope !== "string"
        || typeof row.grant_id !== "string"
        || typeof row.access_expires_at !== "string"
    ) return null;
    return row as unknown as AccessTokenRpcResult;
}

/**
 * Validate and consume an authorization code, create its grant, and persist
 * the first token pair in one database transaction.
 */
export async function exchangeAuthorizationCode(input: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    resource: string;
}): Promise<IssuedTokens | null> {
    if (!input.code || !input.clientId || !input.redirectUri || !input.codeVerifier) return null;
    const sb = getSupabaseAdmin();
    const accessToken = randomToken("jbat_");
    const refreshToken = randomToken("jbrt_");
    const { data, error } = await sb.rpc("oauth_exchange_authorization_code", {
        p_code_hash: sha256(input.code),
        p_client_id: input.clientId,
        p_redirect_uri: input.redirectUri,
        p_code_challenge: pkceS256Challenge(input.codeVerifier),
        p_resource: input.resource,
        p_access_token_hash: sha256(accessToken),
        p_refresh_token_hash: sha256(refreshToken),
    });
    if (error) throw new Error(`Failed to exchange authorization code: ${error.message}`);

    const result = tokenRpcResult(data);
    if (!result) return null;

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: ACCESS_TTL_SECONDS,
        scope: serializeOAuthScopes(effectiveOAuthScopes(result.scope)),
        grant_id: result.grant_id,
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
    resource: string;
    requestedScopes?: readonly OAuthScope[];
}): Promise<IssuedTokens | null> {
    if (!input.refreshToken || !input.clientId) return null;
    const sb = getSupabaseAdmin();
    const accessToken = randomToken("jbat_");
    const refreshToken = randomToken("jbrt_");
    const { data, error } = await sb.rpc("oauth_rotate_refresh_token", {
        p_refresh_token_hash: sha256(input.refreshToken),
        p_client_id: input.clientId,
        p_resource: input.resource,
        p_requested_scope: input.requestedScopes ? serializeOAuthScopes(input.requestedScopes) : null,
        p_new_access_token_hash: sha256(accessToken),
        p_new_refresh_token_hash: sha256(refreshToken),
    });
    if (error) throw new Error(`Failed to rotate refresh token: ${error.message}`);

    const result = tokenRpcResult(data);
    if (!result) return null;
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: ACCESS_TTL_SECONDS,
        scope: serializeOAuthScopes(effectiveOAuthScopes(result.scope)),
        grant_id: result.grant_id,
    };
}

/**
 * Resolve an OAuth access token to its Clerk user id, or null. Touched on the
 * hot path (every MCP call), so it's a single indexed hash lookup.
 */
export async function validateAccessToken(token: string | null | undefined): Promise<string | null> {
    const info = await validateAccessTokenInfo(token);
    return info?.userId ?? null;
}

export async function validateAccessTokenInfo(token: string | null | undefined) {
    if (!token || !token.startsWith("jbat_")) return null;
    const sb = getSupabaseAdmin();

    const resource = getMcpResourceUrl();
    const { data, error } = await sb.rpc("oauth_validate_access_token", {
        p_access_token_hash: sha256(token),
        p_resource: resource,
        p_issuer: configuredIssuer(),
    });
    if (error) {
        console.error("[oauth/access-token] database check failed", { code: error.code });
        return null;
    }

    const result = accessTokenRpcResult(data);
    if (!result) return null;
    if (new Date(result.access_expires_at).getTime() < Date.now()) return null;
    const scope = serializeOAuthScopes(effectiveOAuthScopes(result.scope));
    if (!scope) return null;
    return {
        userId: result.user_id,
        clientId: result.client_id,
        grantId: result.grant_id,
        scope,
        rawScope: result.scope,
        expiresAt: new Date(result.access_expires_at).getTime() / 1000,
    };
}

export interface OAuthGrantSummary {
    id: string;
    clientId: string;
    clientOrigin: string;
    clientName: string | null;
    scopes: OAuthScope[];
    createdAt: string;
    lastUsedAt: string | null;
}

/** List active connector grants owned by one Clerk user. */
export async function listOAuthGrants(userId: string): Promise<OAuthGrantSummary[]> {
    if (!userId) return [];
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from("oauth_grants")
        .select("id, client_id, scope, created_at, last_used_at, oauth_clients!inner(client_name, redirect_uris, issuer)")
        .eq("user_id", userId)
        .eq("oauth_clients.issuer", configuredIssuer())
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to list connector grants: ${error.message}`);

    return (data ?? []).map((value) => {
        const row = value as unknown as Record<string, unknown>;
        const relation = Array.isArray(row.oauth_clients) ? row.oauth_clients[0] : row.oauth_clients;
        const client = relation && typeof relation === "object" ? relation as Record<string, unknown> : null;
        const identity = oauthClientDisplayIdentity({
            client_name: typeof client?.client_name === "string" ? client.client_name : null,
            redirect_uris: Array.isArray(client?.redirect_uris)
                ? client.redirect_uris.filter((uri): uri is string => typeof uri === "string")
                : [],
        });
        return {
            id: String(row.id),
            clientId: String(row.client_id),
            clientOrigin: identity.redirectOrigin,
            clientName: identity.unverifiedName,
            scopes: effectiveOAuthScopes(typeof row.scope === "string" ? row.scope : ""),
            createdAt: String(row.created_at),
            lastUsedAt: typeof row.last_used_at === "string" ? row.last_used_at : null,
        };
    });
}

/** Revoke one complete access/refresh token family after checking ownership. */
export async function revokeOAuthGrant(userId: string, grantId: string): Promise<boolean> {
    if (!userId || !grantId) return false;
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.rpc("oauth_revoke_grant", {
        p_grant_id: grantId,
        p_user_id: userId,
        p_reason: "user_revoked",
    });
    if (error) throw new Error(`Failed to revoke connector grant: ${error.message}`);
    return data === true;
}

/** Used by account-deletion handling so OAuth credentials do not outlive users. */
export async function revokeAllOAuthGrants(userId: string): Promise<number> {
    if (!userId) return 0;
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.rpc("oauth_revoke_all_user_grants", { p_user_id: userId });
    if (error) throw new Error(`Failed to revoke user connector grants: ${error.message}`);
    return typeof data === "number" ? data : Number(data) || 0;
}

/**
 * Consume one request from a shared Supabase-backed grant bucket. This is the
 * authoritative connector limiter; process-local IP limiting remains only a
 * coarse pre-authentication abuse guard.
 */
export async function consumeConnectorRateLimit(
    grantId: string,
    limit = 120,
    windowSeconds = 60,
): Promise<boolean> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(grantId)) {
        return false;
    }
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.rpc("oauth_consume_rate_limit", {
        p_grant_id: grantId,
        p_bucket_key: "mcp",
        p_limit: limit,
        p_window_seconds: windowSeconds,
    });
    if (error) {
        console.error("[oauth/rate-limit] database check failed", { code: error.code });
        return false;
    }
    return data === true;
}
