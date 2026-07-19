import {
  encodeSessionId,
  MCP_SESSION_HEADER,
  newSessionId,
} from "@posthog/mcp";

type McpHttpHandler = (request: Request) => Response | Promise<Response>;

type InitializeBody = {
  method?: unknown;
  params?: {
    clientInfo?: {
      name?: unknown;
      version?: unknown;
    };
  };
};

type AuthenticatedRequest = Request & { auth?: unknown };

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function initializeClient(request: Request) {
  if (request.method !== "POST") return null;
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return null;

  try {
    const body = await request.clone().json() as InitializeBody;
    if (!body || Array.isArray(body) || body.method !== "initialize") return null;
    return {
      name: stringValue(body.params?.clientInfo?.name),
      version: stringValue(body.params?.clientInfo?.version),
    };
  } catch {
    return null;
  }
}

function requestWithSession(request: AuthenticatedRequest, sessionToken: string) {
  const headers = new Headers(request.headers);
  headers.set(MCP_SESSION_HEADER, sessionToken);
  const cloned = new Request(request, { headers }) as AuthenticatedRequest;
  cloned.auth = request.auth;
  return cloned;
}

function responseWithSession(response: Response, sessionToken: string) {
  const headers = new Headers(response.headers);
  headers.set(MCP_SESSION_HEADER, sessionToken);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Adds PostHog's self-contained MCP session token to stateless SSE handlers.
 * The client replays the token, so separate Vercel invocations remain one MCP
 * analytics session without server-side storage.
 */
export function withStatelessMcpSession(handler: McpHttpHandler): McpHttpHandler {
  return async (request) => {
    if (request.headers.has(MCP_SESSION_HEADER)) return handler(request);

    const client = await initializeClient(request);
    if (!client) return handler(request);

    const sessionToken = encodeSessionId({
      sessionId: newSessionId(),
      clientName: client.name,
      clientVersion: client.version,
    });
    const response = await handler(requestWithSession(request, sessionToken));
    if (!response.ok) return response;
    return responseWithSession(response, sessionToken);
  };
}
