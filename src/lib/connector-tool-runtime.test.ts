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
      properties: expect.objectContaining({ tool_name: "deploy_page", outcome: "error", error_code: "internal_error" }),
    }));
    expect(JSON.stringify(telemetry.event.mock.calls)).not.toContain("private");
    expect(telemetry.exception).toHaveBeenCalledWith({ errorCode: "internal_error", operation: "mcp_tool", toolName: "deploy_page" });
  });

  it("returns a reconnect message for missing scope without creating an incident", () => {
    const error = new ConnectorAuthError("insufficient_scope", "Reconnect Jobing and approve forms:write.");
    expect(normalizeConnectorToolFailure(error, "fallback").operational).toBe(false);
  });
});
