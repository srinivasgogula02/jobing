import { describe, expect, it } from "vitest";
import { resolveClerkAuthorizedParties } from "./clerk-config";

describe("primary Clerk configuration", () => {
  it("authorizes only the primary production origin by default", () => {
    expect(resolveClerkAuthorizedParties(undefined, "production")).toEqual(["https://jobing.site"]);
  });

  it("supports an explicit stable preview origin and normalizes trailing slashes", () => {
    expect(resolveClerkAuthorizedParties(
      "https://jobing-preview.jobing.site/",
      "production",
    )).toEqual(["https://jobing-preview.jobing.site"]);
  });

  it("rejects entries that are not exact web origins", () => {
    expect(() => resolveClerkAuthorizedParties("https://jobing.site/sign-in", "production"))
      .toThrow("CLERK_AUTHORIZED_PARTIES");
    expect(() => resolveClerkAuthorizedParties("file:///tmp/session", "production"))
      .toThrow("CLERK_AUTHORIZED_PARTIES");
  });
});
