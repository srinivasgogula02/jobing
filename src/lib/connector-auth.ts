import { effectiveOAuthScopes, type OAuthScope } from "@/lib/oauth-scopes";
import type { FormsActor } from "@/lib/forms-service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ConnectorAuthInfo = {
  clientId?: string;
  scopes?: string[];
  extra?: Record<string, unknown>;
};

export class ConnectorAuthError extends Error {
  constructor(
    public readonly code: "invalid_connection" | "insufficient_scope",
    message: string,
  ) {
    super(message);
    this.name = "ConnectorAuthError";
  }
}

export function requireConnectorActor(
  authInfo: ConnectorAuthInfo | undefined,
  requiredScope: OAuthScope,
): FormsActor {
  const userId = authInfo?.extra?.userId;
  const grantId = authInfo?.extra?.grantId;
  const clientId = authInfo?.clientId;
  const scopes = effectiveOAuthScopes(authInfo?.scopes?.join(" "));
  if (typeof userId !== "string" || !clientId || typeof grantId !== "string" || !UUID_PATTERN.test(grantId)) {
    throw new ConnectorAuthError("invalid_connection", "The connected Jobing account could not be identified. Reconnect Jobing and try again.");
  }
  if (!scopes.includes(requiredScope)) {
    throw new ConnectorAuthError("insufficient_scope", `This connector has not been granted ${requiredScope}. Reconnect Jobing and approve that permission.`);
  }
  return {
    userId,
    clientId,
    grantId,
    scopes,
  };
}
