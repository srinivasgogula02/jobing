import { describe, expect, it } from "vitest";
import { resolveClerkAuthorizedParties } from "./clerk-config";

describe("primary Clerk configuration", () => {
  it("authorizes only the two production application origins by default", () => {
    expect(resolveClerkAuthorizedParties(undefined, "production")).toEqual([
      "https://jobing.site",
      "https://forms.jobing.site",
    ]);
  });

  it("supports an explicit stable preview pair and normalizes trailing slashes", () => {
    expect(resolveClerkAuthorizedParties(
      "https://jobing-preview.jobing.site/,https://forms-preview.jobing.site/",
      "production",
    )).toEqual([
      "https://jobing-preview.jobing.site",
      "https://forms-preview.jobing.site",
    ]);
  });

  it("rejects entries that are not exact web origins", () => {
    expect(() => resolveClerkAuthorizedParties("https://jobing.site/sign-in", "production"))
      .toThrow("CLERK_AUTHORIZED_PARTIES");
    expect(() => resolveClerkAuthorizedParties("file:///tmp/session", "production"))
      .toThrow("CLERK_AUTHORIZED_PARTIES");
  });
});
