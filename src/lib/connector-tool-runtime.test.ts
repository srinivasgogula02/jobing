import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const telemetry = vi.hoisted(() => ({ event: vi.fn(), exception: vi.fn() }));
vi.mock("@/lib/product-telemetry", () => ({
  captureProductEvent: telemetry.event,
  captureProductException: telemetry.exception,
}));

import { ConnectorAuthError } from "./connector-auth";
import { ConnectedToolError } from "./connected-tools";
import { normalizeConnectorToolFailure, runConnectorTool } from "./connector-tool-runtime";

describe("connector tool runtime", () => {
  beforeEach(() => vi.clearAllMocks());

  it("never exposes an unknown vendor or database error", () => {
    expect(normalizeConnectorToolFailure(new Error("relation secret_table missing for customer@example.com"), "The operation failed."))
      .toEqual({ code: "internal_error", message: "The operation failed.", operational: true });
  });

  it("keeps stable public errors", () => {
    const error = new ConnectedToolError("page_id_taken", "That page address is already taken.");
    expect(normalizeConnectorToolFailure(error, "fallback"))
      .toEqual({ code: "page_id_taken", message: "That page address is already taken.", operational: false });
  });

  it("returns a safe failure and reports it without duplicating official MCP analytics", async () => {
    const result = await runConnectorTool({
      toolName: "deploy_page",
      authInfo: { clientId: "client", scopes: ["pages:write"], extra: { userId: "user", grantId: "5df42931-5953-42a0-bd90-7581a79326db" } },
      requiredScope: "pages:write",
      fallback: "The page could not be deployed.",
      execute: async () => { throw new Error("raw HTML <main>private</main>"); },
    });
    expect(result).toMatchObject({ isError: true, content: [{ text: "The page could not be deployed." }] });
    expect(telemetry.event).not.toHaveBeenCalled();
    expect(JSON.stringify(telemetry.event.mock.calls)).not.toContain("private");
    expect(telemetry.exception).toHaveBeenCalledWith({ errorCode: "internal_error", operation: "mcp_tool", toolName: "deploy_page" });
  });

  it("keeps domain outcome events for product funnels", async () => {
    const result = await runConnectorTool({
      toolName: "deploy_page",
      authInfo: { clientId: "client", scopes: ["pages:write"], extra: { userId: "user", grantId: "5df42931-5953-42a0-bd90-7581a79326db", clientType: "claude" } },
      requiredScope: "pages:write",
      fallback: "Could not deploy the page.",
      properties: { use_case: "marketing_page", page_contains_form: true },
      execute: async () => ({ deployed: true }),
      resultProperties: (value) => ({ resource_status: value.deployed ? "published" : "draft" }),
    });
    expect(result).toEqual({ deployed: true });
    expect(telemetry.event).toHaveBeenCalledWith(expect.objectContaining({
      distinctId: "user",
      event: "page_deploy_completed",
      properties: expect.objectContaining({
        product_area: "pages",
        client_type: "claude",
        page_contains_form: true,
        resource_status: "published",
        outcome: "success",
        use_case: "marketing_page",
      }),
    }));
  });

  it("returns a reconnect message for missing scope without creating an incident", () => {
    const error = new ConnectorAuthError("insufficient_scope", "Reconnect Jobing and approve forms:write.");
    expect(normalizeConnectorToolFailure(error, "fallback").operational).toBe(false);
  });
});
