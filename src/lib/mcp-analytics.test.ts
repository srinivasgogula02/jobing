import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { instrument } from "@posthog/mcp";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createJobingMcpAnalyticsOptions } from "./mcp-analytics";

describe("Jobing MCP analytics", () => {
  it("emits PostHog's official MCP event contract without private tool payloads", async () => {
    const capture = vi.fn();
    const posthog = {
      capture,
      getLibraryId: () => "posthog-node",
      getLibraryVersion: () => "test",
    };
    const server = new McpServer({ name: "jobing-ai", version: "test" });
    server.registerTool(
      "deploy_page",
      {
        description: "Deploy a page",
        inputSchema: {
          html: z.string(),
          useCase: z.literal("marketing_page"),
        },
      },
      async () => ({
        content: [{ type: "text", text: "Deployed https://private.example" }],
        structuredContent: { html: "<main>private customer copy</main>" },
      }),
    );

    instrument(server, posthog as never, createJobingMcpAnalyticsOptions());
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: "analytics-test", version: "1.0.0" });
    await client.connect(clientTransport);

    const tools = await client.listTools();
    const deployTool = tools.tools.find((tool) => tool.name === "deploy_page");
    expect(deployTool?.inputSchema.properties).toHaveProperty("context");

    await client.callTool({
      name: "deploy_page",
      arguments: {
        context: "Create a campaign page for owner@example.com at https://private.example",
        html: "<main>private customer copy</main>",
        useCase: "marketing_page",
      },
    });

    await vi.waitFor(() => {
      expect(capture).toHaveBeenCalledWith(expect.objectContaining({ event: "$mcp_tool_call" }));
    });
    const event = capture.mock.calls
      .map(([value]) => value)
      .find((value) => value.event === "$mcp_tool_call");

    expect(event).toMatchObject({
      event: "$mcp_tool_call",
      properties: {
        $mcp_source: "posthog_mcp_analytics",
        $mcp_tool_name: "deploy_page",
        $mcp_intent_source: "context_parameter",
        product_area: "pages",
        tool_action: "create",
        access_mode: "write",
        use_case: "marketing_page",
      },
    });
    expect(event.properties).not.toHaveProperty("$mcp_parameters");
    expect(event.properties).not.toHaveProperty("$mcp_response");
    expect(event.properties.$mcp_intent).toBe("Create a campaign page for [email] at [link]");
    expect(JSON.stringify(event)).not.toContain("private customer copy");
    expect(JSON.stringify(event)).not.toContain("owner@example.com");

    await client.close();
    await server.close();
  });

  it("advertises a missing-capability tool for unmet agent requests", async () => {
    const options = createJobingMcpAnalyticsOptions();
    expect(options.reportMissing).toBe(true);
    expect(options.missingCapabilityToolName).toBe("get_more_tools");
  });

  it("groups stateless calls by the authenticated Jobing user", async () => {
    const options = createJobingMcpAnalyticsOptions();
    expect(options.enableConversationId).toBe(false);
    expect(typeof options.identify).toBe("function");

    if (typeof options.identify !== "function") throw new Error("MCP user identification is not configured");
    const identify = options.identify;
    const first = await identify({ params: { name: "create_form_draft" } } as never, {
      authInfo: { extra: { userId: "user_123" } },
    } as never);
    const second = await identify({ params: { name: "publish_form" } } as never, {
      authInfo: { extra: { userId: "user_123" } },
    } as never);

    expect(first).toEqual({ distinctId: "user_123" });
    expect(second).toEqual(first);
  });
});
