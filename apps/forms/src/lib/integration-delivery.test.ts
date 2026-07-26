import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/integration-http", () => ({
  integrationHttpRequest: vi.fn(async () => ({ status: 200, body: "{}", headers: {} })),
}));
vi.mock("@/lib/server-telemetry", () => ({
  captureFormsIntegrationError: vi.fn(),
}));

import { integrationHttpRequest } from "@/lib/integration-http";
import { deliverIntegration } from "@/lib/integration-delivery";
import { encryptIntegrationSecret } from "@/lib/integration-crypto";
import { captureFormsIntegrationError } from "@/lib/server-telemetry";

const delivery = {
  deliveryId: "11111111-1111-4111-8111-111111111111",
  integrationId: "22222222-2222-4222-8222-222222222222",
  provider: "email",
  config: { recipients: ["owner@example.com"], subject: "New response to {{form_name}}" },
  secretCiphertext: null,
  secretKeyId: null,
  attempt: 1,
  form: { id: "33333333-3333-4333-8333-333333333333", name: "Project enquiry" },
  submission: {
    id: "44444444-4444-4444-8444-444444444444",
    receivedAt: "2026-07-26T12:00:00.000Z",
    origin: null,
    values: { name: "Asha", needs: "<script>alert(1)</script>" },
  },
};

describe("integration delivery", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.FORMS_NOTIFICATION_FROM = "Jobing Forms <forms@example.com>";
    process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID = "test";
    process.env.FORMS_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
    vi.mocked(integrationHttpRequest).mockClear();
    vi.mocked(captureFormsIntegrationError).mockClear();
  });

  function withSecret(provider: string, config: Record<string, unknown>, secret: Record<string, unknown>) {
    const encrypted = encryptIntegrationSecret(secret);
    return {
      ...delivery,
      provider,
      config,
      secretCiphertext: encrypted.ciphertext,
      secretKeyId: encrypted.keyId,
    };
  }

  it("escapes response values in email notifications", async () => {
    const outcome = await deliverIntegration(delivery);
    expect(outcome.success).toBe(true);
    const request = vi.mocked(integrationHttpRequest).mock.calls[0][0];
    expect(String(request.body)).toContain("&lt;script&gt;");
    expect(String(request.body)).not.toContain("<script>alert");
  });

  it("never dispatches browser analytics through the server outbox", async () => {
    const outcome = await deliverIntegration({
      ...delivery,
      provider: "google_analytics",
      config: { measurementId: "G-ABC12345" },
    });
    expect(outcome.success).toBe(true);
    expect(integrationHttpRequest).not.toHaveBeenCalled();
  });

  it("uses provider-pinned Slack delivery and prevents respondent markdown mentions", async () => {
    const outcome = await deliverIntegration(withSecret(
      "slack",
      { title: "New lead" },
      { webhookUrl: "https://hooks.slack.com/services/T/B/secret" },
    ));

    expect(outcome.success).toBe(true);
    const request = vi.mocked(integrationHttpRequest).mock.calls[0][0];
    expect(request.allowedHosts).toEqual(["hooks.slack.com", "hooks.slack-gov.com"]);
    const body = JSON.parse(String(request.body));
    expect(body.blocks[2].fields[0].type).toBe("plain_text");
  });

  it("signs custom webhook bodies without exposing the signing secret", async () => {
    const outcome = await deliverIntegration(withSecret(
      "webhook",
      { eventName: "form.response.created" },
      { webhookUrl: "https://example.com/jobing", signingSecret: "shared-verification-secret" },
    ));

    expect(outcome.success).toBe(true);
    const request = vi.mocked(integrationHttpRequest).mock.calls[0][0];
    expect(request.headers?.["x-jobing-signature"]).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    expect(String(request.body)).not.toContain("shared-verification-secret");
  });

  it("keeps provider HTTP failures specific and retryable when appropriate", async () => {
    vi.mocked(integrationHttpRequest).mockResolvedValueOnce({ status: 429, body: "slow down", headers: {} });
    const outcome = await deliverIntegration(withSecret(
      "telegram",
      { chatId: "12345" },
      { botToken: "123456:telegram-token" },
    ));

    expect(outcome).toEqual({
      success: false,
      status: 429,
      code: "provider_http_429",
      retryable: true,
    });
  });

  it("classifies safe network error codes without storing sensitive messages", async () => {
    vi.mocked(integrationHttpRequest).mockRejectedValueOnce(
      Object.assign(new Error("getaddrinfo ENOTFOUND secret.example"), { code: "ENOTFOUND" }),
    );
    const outcome = await deliverIntegration(withSecret(
      "webhook",
      { eventName: "form.response.created" },
      { webhookUrl: "https://example.com/jobing", signingSecret: "shared-verification-secret" },
    ));

    expect(outcome).toEqual({
      success: false,
      status: null,
      code: "integration_dns_failed",
      retryable: true,
    });
  });

  it("identifies stored configuration that can no longer be parsed", async () => {
    const outcome = await deliverIntegration({
      ...delivery,
      config: { recipients: [], subject: "" },
    });

    expect(outcome).toEqual({
      success: false,
      status: null,
      code: "integration_configuration_invalid",
      retryable: false,
    });
  });

  it("reports only unexpected delivery exceptions to operational telemetry", async () => {
    vi.mocked(integrationHttpRequest).mockRejectedValueOnce(new TypeError("Unexpected runtime failure"));
    const outcome = await deliverIntegration(withSecret(
      "telegram",
      { chatId: "12345" },
      { botToken: "123456:telegram-token" },
    ));

    expect(outcome.code).toBe("integration_request_failed");
    expect(captureFormsIntegrationError).toHaveBeenCalledWith(
      expect.any(TypeError),
      { provider: "telegram", code: "integration_request_failed", attempt: 1 },
    );
  });
});
