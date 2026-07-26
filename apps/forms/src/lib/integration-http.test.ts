import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isPublicIntegrationAddress, parseIntegrationUrl } from "@/lib/integration-http";

describe("integration destination safety", () => {
  it("rejects local and credential-bearing webhook URLs", () => {
    expect(() => parseIntegrationUrl("http://example.com/hook")).toThrow();
    expect(() => parseIntegrationUrl("https://localhost/hook")).toThrow();
    expect(() => parseIntegrationUrl("https://127.0.0.1/hook")).toThrow();
    expect(() => parseIntegrationUrl("https://user:pass@example.com/hook")).toThrow();
    expect(() => parseIntegrationUrl("https://example.com:8443/hook")).toThrow();
  });

  it("accepts a normal HTTPS endpoint and enforces fixed provider hosts", () => {
    expect(parseIntegrationUrl("https://hooks.example.com/forms?source=jobing").hostname).toBe("hooks.example.com");
    expect(() => parseIntegrationUrl("https://example.com", ["api.example.com"])).toThrow("INTEGRATION_HOST_NOT_ALLOWED");
  });

  it("blocks private, loopback, documentation, and link-local addresses", () => {
    expect(isPublicIntegrationAddress("10.0.0.1")).toBe(false);
    expect(isPublicIntegrationAddress("127.0.0.1")).toBe(false);
    expect(isPublicIntegrationAddress("169.254.169.254")).toBe(false);
    expect(isPublicIntegrationAddress("192.0.2.1")).toBe(false);
    expect(isPublicIntegrationAddress("8.8.8.8")).toBe(true);
    expect(isPublicIntegrationAddress("::1")).toBe(false);
    expect(isPublicIntegrationAddress("2606:4700:4700::1111")).toBe(true);
  });
});
