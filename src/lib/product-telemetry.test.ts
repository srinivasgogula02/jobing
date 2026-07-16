import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ getPostHogClient: () => posthog }));

import { captureProductEvent, sanitizeTelemetryProperties } from "./product-telemetry";

describe("sanitizeTelemetryProperties", () => {
  beforeEach(() => posthog.capture.mockReset());

  it("keeps bounded operational classifications", () => {
    expect(sanitizeTelemetryProperties({
      tool_name: "deploy_page",
      outcome: "success",
      duration_ms: 124,
      is_idempotent_replay: false,
      product_area: "pages",
      tool_action: "create",
      page_contains_form: true,
      mcp_tool_name: "deploy_page",
      mcp_product_area: "pages",
      mcp_use_case: "marketing_page",
      mcp_page_contains_form: true,
    })).toEqual({
      tool_name: "deploy_page",
      outcome: "success",
      duration_ms: 124,
      is_idempotent_replay: false,
      product_area: "pages",
      tool_action: "create",
      page_contains_form: true,
      mcp_tool_name: "deploy_page",
      mcp_product_area: "pages",
      mcp_use_case: "marketing_page",
      mcp_page_contains_form: true,
    });
  });

  it("drops unknown, free-text, and non-finite values", () => {
    expect(sanitizeTelemetryProperties({
      prompt: "Create my private customer page",
      html: "<form>secret</form>",
      origin: "https://customer.example",
      error_code: "Database said customer@example.com was rejected",
      duration_ms: Number.POSITIVE_INFINITY,
      status: "failed",
    })).toEqual({ status: "failed" });
  });

  it("hands searchable MCP properties to the PostHog client", () => {
    captureProductEvent({
      event: "mcp_tool_completed",
      distinctId: "user_123",
      properties: {
        mcp_tool_name: "create_form_draft",
        mcp_product_area: "forms",
        mcp_outcome: "success",
        mcp_use_case: "contact_form",
      },
    });

    expect(posthog.capture).toHaveBeenCalledWith(expect.objectContaining({
      distinctId: "user_123",
      event: "mcp_tool_completed",
      properties: expect.objectContaining({
        mcp_tool_name: "create_form_draft",
        mcp_product_area: "forms",
        mcp_outcome: "success",
        mcp_use_case: "contact_form",
      }),
    }));
  });
});
