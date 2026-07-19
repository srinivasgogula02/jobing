import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { decodeSessionId, instrument, MCP_SESSION_HEADER } from "@posthog/mcp";
import { createMcpHandler } from "mcp-handler";
import { describe, expect, it, vi } from "vitest";
import { withStatelessMcpSession } from "./mcp-session";

function mcpRequest(body: object, sessionId?: string) {
  return new Request("https://jobing.site/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { [MCP_SESSION_HEADER]: sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("stateless MCP sessions", () => {
  it("returns one session token at initialize and reuses it across tool calls", async () => {
    const capture = vi.fn();
    const posthog = {
      capture,
      getLibraryId: () => "posthog-node",
      getLibraryVersion: () => "test",
    };
    const rawHandler = createMcpHandler(
      (server: McpServer) => {
        server.registerTool("ping", {}, async () => ({
          content: [{ type: "text" as const, text: "pong" }],
        }));
        instrument(server, posthog as never);
      },
      { serverInfo: { name: "jobing-ai", version: "test" } },
      { basePath: "", maxDuration: 10 },
    );
    const handler = withStatelessMcpSession(rawHandler);

    const initialized = await handler(mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "ChatGPT", version: "1.0" },
      },
    }));
    const sessionToken = initialized.headers.get(MCP_SESSION_HEADER);
    const decoded = decodeSessionId(sessionToken);

    expect(decoded).toMatchObject({
      sessionId: expect.stringMatching(/^ses_/),
      clientName: "ChatGPT",
      clientVersion: "1.0",
    });

    await handler(mcpRequest(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "ping", arguments: {} } },
      sessionToken ?? undefined,
    ));
    await handler(mcpRequest(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "ping", arguments: {} } },
      sessionToken ?? undefined,
    ));

    await vi.waitFor(() => {
      expect(capture.mock.calls.filter(([event]) => event.event === "$mcp_tool_call")).toHaveLength(2);
    });
    const toolSessions = capture.mock.calls
      .map(([event]) => event)
      .filter((event) => event.event === "$mcp_tool_call")
      .map((event) => event.properties.$session_id);

    expect(toolSessions).toEqual([decoded?.sessionId, decoded?.sessionId]);
  });

  it("does not create a session for ordinary requests or failed initialization", async () => {
    const ordinaryHandler = vi.fn(async () => new Response(null, { status: 202 }));
    const ordinary = withStatelessMcpSession(ordinaryHandler);
    const ordinaryResponse = await ordinary(mcpRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }));
    expect(ordinaryResponse.headers.has(MCP_SESSION_HEADER)).toBe(false);

    const failing = withStatelessMcpSession(async () => new Response("failed", { status: 500 }));
    const failedResponse = await failing(mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { clientInfo: { name: "test", version: "1" } },
    }));
    expect(failedResponse.headers.has(MCP_SESSION_HEADER)).toBe(false);
  });

  it("preserves OAuth authentication when cloning the initialize request", async () => {
    const auth = {
      token: "test-token",
      clientId: "chatgpt",
      scopes: ["pages:write"],
      extra: { userId: "user_123" },
    };
    let receivedAuth: unknown;
    const handler = withStatelessMcpSession(async (request) => {
      receivedAuth = (request as Request & { auth?: unknown }).auth;
      return new Response("initialized");
    });
    const request = mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { clientInfo: { name: "ChatGPT", version: "1" } },
    }) as Request & { auth?: unknown };
    request.auth = auth;

    await handler(request);

    expect(receivedAuth).toBe(auth);
  });
});
