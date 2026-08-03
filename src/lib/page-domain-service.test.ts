import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("@/lib/page-entitlements", () => ({ getPageEntitlement: vi.fn() }));

import { normalizeCustomDomain, PageDomainError } from "./page-domain-service";

describe("custom page domain normalization", () => {
  it.each([
    ["Example.COM.", "example.com"],
    ["https://pages.example.com/", "pages.example.com"],
    ["bücher.example", "xn--bcher-kva.example"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeCustomDomain(input)).toBe(expected);
  });

  it.each([
    "",
    "localhost",
    "127.0.0.1",
    "*.example.com",
    "https://example.com/contact",
    "http://example.com",
    "jobing.online",
    "customer.jobing.site",
    "preview.vercel.app",
  ])("rejects unsafe or non-domain input %j", (input) => {
    expect(() => normalizeCustomDomain(input)).toThrow(PageDomainError);
  });
});
