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

  it("records only completion classifications and reports unexpected failures", async () => {
    const result = await runConnectorTool({
      toolName: "deploy_page",
      authInfo: { clientId: "client", scopes: ["pages:write"], extra: { userId: "user", grantId: "5df42931-5953-42a0-bd90-7581a79326db" } },
      requiredScope: "pages:write",
      fallback: "The page could not be deployed.",
      execute: async () => { throw new Error("raw HTML <main>private</main>"); },
    });
    expect(result).toMatchObject({ isError: true, content: [{ text: "The page could not be deployed." }] });
    expect(telemetry.event).toHaveBeenCalledWith(expect.objectContaining({
      distinctId: "user",
      properties: expect.objectContaining({
        tool_name: "deploy_page",
        product_area: "pages",
        tool_action: "create",
        access_mode: "write",
        primary_scope: "pages:write",
        client_type: "other",
        outcome: "error",
        error_code: "internal_error",
        error_class: "dependency",
        mcp_tool_name: "deploy_page",
        mcp_product_area: "pages",
        mcp_outcome: "error",
        mcp_error_code: "internal_error",
        mcp_use_case: "unspecified",
      }),
    }));
    expect(JSON.stringify(telemetry.event.mock.calls)).not.toContain("private");
    expect(telemetry.exception).toHaveBeenCalledWith({ errorCode: "internal_error", operation: "mcp_tool", toolName: "deploy_page" });
  });

  it("records classified success properties from the tool and result", async () => {
    const result = await runConnectorTool({
      toolName: "list_form_responses",
      authInfo: { clientId: "client", scopes: ["forms.responses:read"], extra: { userId: "user", grantId: "5df42931-5953-42a0-bd90-7581a79326db", clientType: "claude" } },
      requiredScope: "forms.responses:read",
      fallback: "Could not read responses.",
      properties: { query_used: true, response_state: "inbox", use_case: "job_application" },
      execute: async () => ({ items: 3, hidden: true }),
      resultProperties: (value) => ({ result_count_bucket: value.items === 3 ? "2_5" : "0", has_hidden_results: value.hidden }),
    });
    expect(result).toEqual({ items: 3, hidden: true });
    expect(telemetry.event).toHaveBeenCalledWith(expect.objectContaining({
      distinctId: "user",
      properties: expect.objectContaining({
        tool_name: "list_form_responses",
        product_area: "responses",
        tool_action: "read",
        access_mode: "read",
        client_type: "claude",
        query_used: true,
        result_count_bucket: "2_5",
        has_hidden_results: true,
        outcome: "success",
        mcp_tool_name: "list_form_responses",
        mcp_product_area: "responses",
        mcp_tool_action: "read",
        mcp_client_type: "claude",
        mcp_query_used: true,
        mcp_result_count_bucket: "2_5",
        mcp_has_hidden_results: true,
        mcp_outcome: "success",
        mcp_use_case: "job_application",
      }),
    }));
  });

  it("returns a reconnect message for missing scope without creating an incident", () => {
    const error = new ConnectorAuthError("insufficient_scope", "Reconnect Jobing and approve forms:write.");
    expect(normalizeConnectorToolFailure(error, "fallback").operational).toBe(false);
  });
});
