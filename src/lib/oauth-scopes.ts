/**
 * OAuth scopes exposed by the Jobing MCP connector.
 *
 * `mcp` was the original all-or-nothing scope. It is deliberately not stored
 * on new grants. During fresh consent it is a compatibility alias for the
 * complete current connector scope set. Existing rows that contain it retain
 * only the two permissions shown on the original consent screen: creating
 * notes and deploying pages.
 */
export const OAUTH_SCOPES = [
  "notes:write",
  "pages:write",
  "forms:read",
  "forms:write",
  "forms:publish",
] as const;

export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export const LEGACY_MCP_SCOPE = "mcp";

export const DEFAULT_CONNECTOR_SCOPES: readonly OAuthScope[] = OAUTH_SCOPES;

export const OAUTH_SCOPE_DETAILS: Record<OAuthScope, { title: string; description: string }> = {
  "notes:write": {
    title: "Create notes",
    description: "Create new shareable notes in your Jobing account.",
  },
  "pages:write": {
    title: "Deploy pages",
    description: "Deploy new public HTML pages owned by your Jobing account.",
  },
  "forms:read": {
    title: "View form definitions",
    description: "View your form names, fields, status, and public links. This does not include responses.",
  },
  "forms:write": {
    title: "Create and edit forms",
    description: "Create new forms and edit their unpublished drafts.",
  },
  "forms:publish": {
    title: "Publish forms",
    description: "Publish, pause, and test forms created for your account.",
  },
};

const KNOWN_SCOPES = new Set<string>(OAUTH_SCOPES);
const SCOPE_ORDER = new Map<string, number>(OAUTH_SCOPES.map((scope, index) => [scope, index]));

export class InvalidOAuthScopeError extends Error {
  readonly invalidScopes: string[];

  constructor(invalidScopes: string[]) {
    super(`Unsupported OAuth scope${invalidScopes.length === 1 ? "" : "s"}: ${invalidScopes.join(", ")}`);
    this.name = "InvalidOAuthScopeError";
    this.invalidScopes = invalidScopes;
  }
}

function splitScope(scope: string): string[] {
  return scope.trim() ? scope.trim().split(/\s+/) : [];
}

function sortScopes(scopes: Iterable<OAuthScope>): OAuthScope[] {
  return [...new Set(scopes)].sort(
    (left, right) => (SCOPE_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) - (SCOPE_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Validate scopes requested during a new authorization flow.
 *
 * Clients with cached pre-Phase-1 metadata may still request `mcp`. Fresh
 * consent expands that alias to every current connector permission so the user
 * sees and explicitly approves the complete list before canonical scopes are
 * stored.
 */
export function normalizeRequestedScopes(scope: string | null | undefined): OAuthScope[] {
  const requested = splitScope(scope ?? "");
  if (requested.length === 0) return [...DEFAULT_CONNECTOR_SCOPES];

  const normalized: OAuthScope[] = [];
  const invalid: string[] = [];

  for (const value of requested) {
    if (value === LEGACY_MCP_SCOPE) {
      normalized.push(...DEFAULT_CONNECTOR_SCOPES);
    } else if (KNOWN_SCOPES.has(value)) {
      normalized.push(value as OAuthScope);
    } else {
      invalid.push(value);
    }
  }

  if (invalid.length > 0) throw new InvalidOAuthScopeError([...new Set(invalid)]);
  return sortScopes(normalized);
}

/** Validate a refresh request without adding the default creator scopes. */
export function normalizeOptionalRequestedScopes(scope: string | null | undefined): OAuthScope[] | undefined {
  if (!scope?.trim()) return undefined;
  const requested = splitScope(scope);
  if (requested.every((value) => value === LEGACY_MCP_SCOPE)) return undefined;
  return normalizeRequestedScopes(scope);
}

/**
 * Expand a stored grant scope while failing closed for unknown future values.
 * This is the only place the legacy `mcp` database value gains permissions.
 */
export function effectiveOAuthScopes(storedScope: string | null | undefined): OAuthScope[] {
  const effective: OAuthScope[] = [];
  for (const value of splitScope(storedScope ?? "")) {
    if (value === LEGACY_MCP_SCOPE) {
      effective.push("notes:write", "pages:write");
    } else if (KNOWN_SCOPES.has(value)) {
      effective.push(value as OAuthScope);
    }
  }
  return sortScopes(effective);
}

export function serializeOAuthScopes(scopes: Iterable<OAuthScope>): string {
  return sortScopes(scopes).join(" ");
}

export function hasOAuthScopes(granted: Iterable<OAuthScope>, required: Iterable<OAuthScope>): boolean {
  const available = new Set(granted);
  return [...required].every((scope) => available.has(scope));
}
