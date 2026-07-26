import { describe, expect, it } from "vitest";
import type { FormIntegration } from "@/lib/forms-service";
import { getFormIntegrationStatus } from "@/lib/form-integration-status";

function integration(overrides: Partial<FormIntegration> = {}): FormIntegration {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    formId: "22222222-2222-4222-8222-222222222222",
    provider: "telegram",
    status: "active",
    config: {},
    hasSecret: true,
    lastDeliveryAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastErrorCode: null,
    pendingDeliveries: 0,
    failedDeliveries: 0,
    updatedAt: "2026-07-27T10:00:00.000Z",
    ...overrides,
  };
}

describe("form integration status", () => {
  it("distinguishes a healthy queue from a delivery retry", () => {
    expect(getFormIntegrationStatus(integration({ pendingDeliveries: 2 }), "Telegram"))
      .toMatchObject({ state: "queued", badge: "Sending", pendingLabel: "In queue" });

    expect(getFormIntegrationStatus(integration({
      pendingDeliveries: 2,
      lastErrorCode: "integration_request_failed",
      lastFailureAt: "2026-07-27T09:59:00.000Z",
    }), "Telegram")).toMatchObject({
      state: "retrying",
      badge: "Retrying",
      pendingLabel: "Retrying",
    });
  });

  it("explains rejected credentials in plain language", () => {
    const result = getFormIntegrationStatus(integration({
      pendingDeliveries: 1,
      lastErrorCode: "provider_http_401",
    }), "Airtable");

    expect(result.detail).toContain("rejected the saved credentials");
    expect(result.action).toContain("required access");
  });

  it("makes a permanent failure more urgent than queued retries", () => {
    const result = getFormIntegrationStatus(integration({
      pendingDeliveries: 2,
      failedDeliveries: 1,
      lastErrorCode: "provider_http_404",
    }), "Google Sheets");

    expect(result).toMatchObject({ state: "failed", badge: "Needs attention" });
    expect(result.headline).toBe("1 delivery could not be sent");
    expect(result.action).toContain("stopped retrying");
  });

  it("does not show a stale failure as the current connection state after recovery", () => {
    const result = getFormIntegrationStatus(integration({
      failedDeliveries: 1,
      lastFailureAt: "2026-07-27T09:00:00.000Z",
      lastSuccessAt: "2026-07-27T10:00:00.000Z",
      lastErrorCode: null,
    }), "Telegram");

    expect(result).toMatchObject({
      state: "connected",
      badge: "Connected",
      headline: "Delivery is working again",
    });
    expect(result.action).toContain("1 older delivery");
  });

  it("identifies a server-side Jobing configuration problem", () => {
    const result = getFormIntegrationStatus(integration({
      pendingDeliveries: 1,
      lastErrorCode: "integration_encryption_key_unavailable",
    }), "Webhook");

    expect(result.detail).toContain("Jobing's delivery service");
    expect(result.action).toContain("Contact Jobing support");
  });
});
