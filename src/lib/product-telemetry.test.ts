import { describe, expect, it } from "vitest";
import { sanitizeTelemetryProperties } from "./product-telemetry";

describe("sanitizeTelemetryProperties", () => {
  it("keeps bounded operational classifications", () => {
    expect(sanitizeTelemetryProperties({
      tool_name: "deploy_page",
      outcome: "success",
      duration_ms: 124,
      is_idempotent_replay: false,
    })).toEqual({
      tool_name: "deploy_page",
      outcome: "success",
      duration_ms: 124,
      is_idempotent_replay: false,
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
});
