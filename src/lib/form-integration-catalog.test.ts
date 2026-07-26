import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formIntegrationCatalog, integrationSettingsFromFormData } from "@/lib/form-integration-catalog";

describe("form integration catalog", () => {
  it("covers every documented HeyForm integration without duplicates", () => {
    expect(formIntegrationCatalog).toHaveLength(14);
    expect(new Set(formIntegrationCatalog.map((entry) => entry.provider)).size).toBe(14);
  });

  it("puts the most useful starting integrations first", () => {
    expect(formIntegrationCatalog.slice(0, 4).map((entry) => entry.provider)).toEqual([
      "webhook",
      "google_sheets",
      "airtable",
      "facebook_pixel",
    ]);
  });

  it("preserves a stored secret when a configuration edit leaves it blank", () => {
    const data = new FormData();
    data.set("provider", "slack");
    data.set("title", "New lead");
    const parsed = integrationSettingsFromFormData(data);
    expect(parsed.secret).toBeUndefined();
    expect(parsed.replaceSecret).toBe(false);
  });

  it("never creates a webhook signing secret that the owner cannot retrieve", () => {
    const data = new FormData();
    data.set("provider", "webhook");
    data.set("webhookUrl", "https://example.com/jobing");
    expect(() => integrationSettingsFromFormData(data)).toThrow("WEBHOOK_URL_AND_SIGNING_SECRET_REQUIRED");

    data.set("signingSecret", "shared-verification-secret");
    expect(integrationSettingsFromFormData(data).secret).toEqual({
      webhookUrl: "https://example.com/jobing",
      signingSecret: "shared-verification-secret",
    });
  });
});
