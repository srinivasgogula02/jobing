import { describe, expect, it } from "vitest";
import {
  classifyConnectorClient,
  classifyProductPage,
  countBucket,
  durationBucket,
  MCP_TOOL_METADATA,
  payloadSizeBucket,
} from "./product-analytics-contract";

describe("product analytics contract", () => {
  it("classifies connector clients without storing redirect URLs", () => {
    expect(classifyConnectorClient(["https://chatgpt.com/connector/callback"])).toBe("chatgpt");
    expect(classifyConnectorClient(["https://claude.ai/api/mcp/auth_callback"])).toBe("claude");
    expect(classifyConnectorClient(["https://example.com/callback"])).toBe("other");
  });

  it("assigns every current MCP tool a product area and action", () => {
    expect(MCP_TOOL_METADATA.publish_form).toEqual({ productArea: "forms", toolAction: "publish", accessMode: "write" });
    expect(MCP_TOOL_METADATA.list_form_responses).toEqual({ productArea: "responses", toolAction: "read", accessMode: "read" });
    expect(MCP_TOOL_METADATA.delete_page.accessMode).toBe("destructive");
  });

  it("uses stable low-cardinality buckets", () => {
    expect(durationBucket(2_500)).toBe("1s_3s");
    expect(countBucket(42)).toBe("21_100");
    expect(payloadSizeBucket(120_000)).toBe("gte_100k");
  });

  it("masks dynamic routes into product page names", () => {
    expect(classifyProductPage("/dashboard/forms/6b929a94-c41e-43da-b28f-a584648e14ef/edit")).toEqual({ pageName: "form_editor", productArea: "forms", replayEligible: true });
    expect(classifyProductPage("/pages/weather-app/edit")).toEqual({ pageName: "page_editor", productArea: "pages", replayEligible: true });
    expect(classifyProductPage("/sign-in").replayEligible).toBe(false);
  });
});
