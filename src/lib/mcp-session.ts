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

function nativeRequest(
  request: AuthenticatedRequest,
  body: string,
  sessionToken?: string,
) {
  const headers = new Headers(request.headers);
  if (sessionToken) headers.set(MCP_SESSION_HEADER, sessionToken);
  const rebuilt = new Request(request.url, {
    method: request.method,
    headers,
    body,
  }) as AuthenticatedRequest;
  rebuilt.auth = request.auth;
  return rebuilt;
}

async function inspectJsonRequest(request: AuthenticatedRequest) {
  if (request.method !== "POST") return null;
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return null;

  const bodyText = await request.text();
  const rebuilt = nativeRequest(request, bodyText);
  try {
    const body = JSON.parse(bodyText) as InitializeBody;
    if (!body || Array.isArray(body) || body.method !== "initialize") {
      return { request: rebuilt, bodyText, client: null };
    }
    return {
      request: rebuilt,
      bodyText,
      client: {
        name: stringValue(body.params?.clientInfo?.name),
        version: stringValue(body.params?.clientInfo?.version),
      },
    };
  } catch {
    return { request: rebuilt, bodyText, client: null };
  }
}

function responseWithSession(response: Response, sessionToken: string) {
  response.headers.set(MCP_SESSION_HEADER, sessionToken);
  return response;
}

/**
 * Adds PostHog's self-contained MCP session token to stateless SSE handlers.
 * The client replays the token, so separate Vercel invocations remain one MCP
 * analytics session without server-side storage.
 */
export function withStatelessMcpSession(handler: McpHttpHandler): McpHttpHandler {
  return async (request) => {
    if (request.headers.has(MCP_SESSION_HEADER)) return handler(request);

    const inspected = await inspectJsonRequest(request);
    if (!inspected) return handler(request);
    if (!inspected.client) return handler(inspected.request);

    const sessionToken = encodeSessionId({
      sessionId: newSessionId(),
      clientName: inspected.client.name,
      clientVersion: inspected.client.version,
    });
    const sessionRequest = nativeRequest(request, inspected.bodyText, sessionToken);
    const response = await handler(sessionRequest);
    if (!response.ok) return response;
    return responseWithSession(response, sessionToken);
  };
}
