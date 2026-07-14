import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex, signInternalPayload, verifyInternalSignature } from "./internal-auth";

function signedRequest(rawBody = '{"ok":true}', overrides: Partial<{ method: string; path: string; timestamp: number; nonce: string }> = {}) {
  const secret = "test-secret-with-enough-entropy";
  const method = overrides.method ?? "POST";
  const path = overrides.path ?? "/api/internal/v1/forms";
  const timestamp = overrides.timestamp ?? 1_700_000_000;
  const nonce = overrides.nonce ?? "nonce_1234567890abcd";
  const bodySha256 = sha256Hex(rawBody);
  const signature = signInternalPayload(secret, { method, path, timestamp, nonce, bodySha256 });
  const headers = new Headers({
    "x-jobing-key-id": "test",
    "x-jobing-timestamp": String(timestamp),
    "x-jobing-nonce": nonce,
    "x-jobing-content-sha256": bodySha256,
    "x-jobing-signature": `v1=${signature}`,
  });
  return { rawBody, method, path, timestamp, headers, secrets: new Map([["test", secret]]) };
}

describe("internal request signatures", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a current signature", () => {
    const request = signedRequest();
    expect(verifyInternalSignature({ ...request, nowSeconds: request.timestamp })).toMatchObject({ keyId: "test" });
  });

  it.each([
    ["body", { rawBody: '{"ok":false}' }],
    ["path", { path: "/api/internal/v1/other" }],
    ["method", { method: "DELETE" }],
  ])("rejects a tampered %s", (_label, change) => {
    const request = signedRequest();
    expect(() => verifyInternalSignature({ ...request, ...change, nowSeconds: request.timestamp })).toThrow();
  });

  it("rejects expired signatures", () => {
    const request = signedRequest();
    expect(() => verifyInternalSignature({ ...request, nowSeconds: request.timestamp + 301 })).toThrow("expired");
  });

  it("fails closed when the configured current secret is too short", () => {
    const request = signedRequest();
    vi.stubEnv("FORMS_INTERNAL_KEY_ID", "test");
    vi.stubEnv("FORMS_INTERNAL_SECRET", "too-short");
    expect(() => verifyInternalSignature({
      ...request,
      secrets: undefined,
      nowSeconds: request.timestamp,
    })).toThrow("not configured correctly");
  });

  it("rejects a rotation pair that reuses the current key ID", () => {
    const request = signedRequest();
    const secret = "a-valid-secret-with-at-least-thirty-two-bytes";
    vi.stubEnv("FORMS_INTERNAL_KEY_ID", "same-key");
    vi.stubEnv("FORMS_INTERNAL_SECRET", secret);
    vi.stubEnv("FORMS_INTERNAL_PREVIOUS_KEY_ID", "same-key");
    vi.stubEnv("FORMS_INTERNAL_PREVIOUS_SECRET", `${secret}-previous`);
    expect(() => verifyInternalSignature({
      ...request,
      secrets: undefined,
      nowSeconds: request.timestamp,
    })).toThrow("not configured correctly");
  });
});
