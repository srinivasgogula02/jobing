import { describe, expect, it } from "vitest";
import {
  getFormsSignInRedirectProps,
  resolveClerkAuthorizedParties,
} from "./clerk-config";

describe("Forms Clerk configuration", () => {
  it("redirects sign-in and sign-up completions to the fixed Forms app path", () => {
    expect(getFormsSignInRedirectProps("https://preview.jobing.site/forms", "production")).toEqual({
      mode: "redirect",
      forceRedirectUrl: "https://preview.jobing.site/forms/app",
      signUpForceRedirectUrl: "https://preview.jobing.site/forms/app",
    });
  });

  it("never accepts a path, query, credentials, or non-web scheme as the return origin", () => {
    expect(() => getFormsSignInRedirectProps("https://jobing.site/elsewhere"))
      .toThrow("NEXT_PUBLIC_FORMS_SITE_URL");
    expect(() => getFormsSignInRedirectProps("https://user:pass@jobing.site/forms"))
      .toThrow("NEXT_PUBLIC_FORMS_SITE_URL");
    expect(() => getFormsSignInRedirectProps("javascript:alert(1)"))
      .toThrow("NEXT_PUBLIC_FORMS_SITE_URL");
  });

  it("normalizes and deduplicates explicitly authorized origins", () => {
    expect(resolveClerkAuthorizedParties(
      "https://jobing.site/,https://jobing.site",
      "production",
    )).toEqual(["https://jobing.site"]);
  });

  it("uses only local origins by default outside production", () => {
    expect(resolveClerkAuthorizedParties(undefined, "test")).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });
});
