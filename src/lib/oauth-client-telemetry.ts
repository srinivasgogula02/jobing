import "server-only";

import { getClient } from "@/lib/oauth";
import { classifyConnectorClient, type ConnectorClientType } from "@/lib/product-analytics-contract";

const CLIENT_TYPE_TTL_MS = 10 * 60 * 1_000;
const MAX_CACHED_CLIENTS = 500;
const clientTypes = new Map<string, { value: ConnectorClientType; expiresAt: number }>();

export async function getConnectorClientType(clientId: string): Promise<ConnectorClientType> {
  const cached = clientTypes.get(clientId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: ConnectorClientType = "other";
  try {
    const client = await getClient(clientId);
    if (client) value = classifyConnectorClient(client.redirect_uris);
  } catch {
    // Analytics enrichment is optional and must never block MCP authentication.
  }

  if (clientTypes.size >= MAX_CACHED_CLIENTS) {
    const oldest = clientTypes.keys().next().value;
    if (oldest) clientTypes.delete(oldest);
  }
  clientTypes.set(clientId, { value, expiresAt: Date.now() + CLIENT_TYPE_TTL_MS });
  return value;
}
