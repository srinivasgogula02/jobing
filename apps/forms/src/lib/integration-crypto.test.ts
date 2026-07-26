import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decryptIntegrationSecret, encryptIntegrationSecret, integrationEncryptionConfigured } from "@/lib/integration-crypto";

const original = {
  key: process.env.FORMS_INTEGRATION_ENCRYPTION_KEY,
  keyId: process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID,
};

afterEach(() => {
  process.env.FORMS_INTEGRATION_ENCRYPTION_KEY = original.key;
  process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID = original.keyId;
});

describe("integration credential encryption", () => {
  it("round trips credentials with authenticated encryption", () => {
    process.env.FORMS_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.FORMS_INTEGRATION_ENCRYPTION_KEY_ID = "test";

    const encrypted = encryptIntegrationSecret({ token: "private-value" });
    expect(encrypted.keyId).toBe("test");
    expect(encrypted.ciphertext).not.toContain("private-value");
    expect(decryptIntegrationSecret(encrypted.keyId, encrypted.ciphertext)).toEqual({ token: "private-value" });
  });

  it("fails closed when the key is missing", () => {
    delete process.env.FORMS_INTEGRATION_ENCRYPTION_KEY;
    expect(integrationEncryptionConfigured()).toBe(false);
    expect(() => encryptIntegrationSecret({ token: "secret" })).toThrow("INTEGRATION_ENCRYPTION_KEY_UNAVAILABLE");
  });
});
