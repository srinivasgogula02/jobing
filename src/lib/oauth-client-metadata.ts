const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// RFC 7591 client_name is self-asserted metadata. Keep it useful as a hint,
// but remove characters that can alter text direction, disappear, or resemble
// markup before any UI renders it. The registered redirect origin remains the
// identity users should trust.
const UNSAFE_DISPLAY_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff<>]/gu;

export function normalizeUntrustedClientName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(UNSAFE_DISPLAY_CHARACTERS, "")
    .replace(/\s+/gu, " ")
    .trim();
  return Array.from(normalized).slice(0, 100).join("") || null;
}

/**
 * Jobing accepts browser HTTPS redirects and RFC 8252 loopback HTTP redirects.
 * Fragments and userinfo are rejected because they are never valid code-return
 * destinations and make the displayed destination misleading.
 */
export function isAllowedOAuthRedirectUri(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048 || value !== value.trim()) {
    return false;
  }
  if (/[\u0000-\u001f\u007f]/u.test(value)) return false;

  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash || !url.hostname) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function oauthRedirectOrigin(redirectUri: string | null | undefined): string | null {
  if (!redirectUri) return null;
  try {
    const url = new URL(redirectUri);
    return url.origin === "null" ? null : url.origin;
  } catch {
    return null;
  }
}

export interface OAuthClientIdentitySource {
  redirect_uris: readonly string[];
  client_name?: string | null;
}

export interface OAuthClientDisplayIdentity {
  redirectOrigin: string;
  unverifiedName: string | null;
}

/**
 * Build a consent-safe identity. When an authorization request selected one of
 * several registered redirects, show that exact redirect's normalized origin.
 */
export function oauthClientDisplayIdentity(
  client: OAuthClientIdentitySource,
  selectedRedirectUri?: string,
): OAuthClientDisplayIdentity {
  const selected = selectedRedirectUri && client.redirect_uris.includes(selectedRedirectUri)
    ? selectedRedirectUri
    : client.redirect_uris[0];

  return {
    redirectOrigin: oauthRedirectOrigin(selected) ?? "Legacy connector",
    unverifiedName: normalizeUntrustedClientName(client.client_name),
  };
}
