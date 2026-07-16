import { describe, expect, it } from "vitest";
import { resolveClerkAuthorizedParties } from "./clerk-config";

describe("Forms Clerk configuration", () => {
  it("normalizes and deduplicates explicitly authorized origins", () => {
    expect(resolveClerkAuthorizedParties(
      "https://jobing.site/,https://jobing.site",
      "production",
    )).toEqual(["https://jobing.site"]);
  });

  it("uses only local origins by default outside production", () => {
    expect(resolveClerkAuthorizedParties("", "test")).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });
});
