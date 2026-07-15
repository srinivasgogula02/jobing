import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONNECTOR_SCOPES,
  InvalidOAuthScopeError,
  OAUTH_SCOPE_DETAILS,
  effectiveOAuthScopes,
  hasOAuthScopes,
  normalizeOptionalRequestedScopes,
  normalizeRequestedScopes,
  serializeOAuthScopes,
} from "./oauth-scopes";

describe("OAuth scope normalization", () => {
  it("defaults new connector approvals to the complete creator scope set", () => {
    expect(normalizeRequestedScopes(undefined)).toEqual(DEFAULT_CONNECTOR_SCOPES);
  });

  it("deduplicates and stores requested scopes in a stable order", () => {
    expect(normalizeRequestedScopes("forms:publish notes:write forms:publish forms:read")).toEqual([
      "notes:write",
      "forms:read",
      "forms:publish",
    ]);
    expect(serializeOAuthScopes(["forms:publish", "notes:write", "forms:read"])).toBe(
      "notes:write forms:read forms:publish",
    );
  });

  it("shows the complete permission set when a cached client requests the legacy mcp alias", () => {
    expect(normalizeRequestedScopes("mcp")).toEqual(DEFAULT_CONNECTOR_SCOPES);
  });

  it("asks fresh connectors for explicit product-feedback permission", () => {
    expect(DEFAULT_CONNECTOR_SCOPES).toContain("feedback:write");
    expect(OAUTH_SCOPE_DETAILS["feedback:write"]).toEqual({
      title: "Send product feedback",
      description: "Send short, user-approved capability requests and product feedback to Jobing.",
    });
  });

  it("rejects unsupported scopes instead of silently broadening or dropping them", () => {
    expect(() => normalizeRequestedScopes("notes:write forms.responses:read admin"))
      .toThrow(InvalidOAuthScopeError);
  });

  it("does not add default scopes to a refresh request that omitted scope", () => {
    expect(normalizeOptionalRequestedScopes(undefined)).toBeUndefined();
  });

  it("treats a cached legacy mcp refresh scope as preserving the existing grant", () => {
    expect(normalizeOptionalRequestedScopes("mcp")).toBeUndefined();
  });
});

describe("stored OAuth scope compatibility", () => {
  it("maps a stored legacy mcp grant to notes and pages only", () => {
    expect(effectiveOAuthScopes("mcp")).toEqual(["notes:write", "pages:write"]);
    expect(effectiveOAuthScopes("mcp")).not.toContain("forms:read");
    expect(effectiveOAuthScopes("mcp")).not.toContain("forms:write");
    expect(effectiveOAuthScopes("mcp")).not.toContain("forms:publish");
    expect(effectiveOAuthScopes("mcp")).not.toContain("forms.responses:read");
    expect(effectiveOAuthScopes("mcp")).not.toContain("pages:manage");
    expect(effectiveOAuthScopes("mcp")).not.toContain("feedback:write");
  });

  it("fails closed for unknown stored scope values", () => {
    expect(effectiveOAuthScopes("notes:write future:admin forms:read")).toEqual([
      "notes:write",
      "forms:read",
    ]);
  });

  it("checks exact required permissions", () => {
    const granted = effectiveOAuthScopes("forms:read forms:write");
    expect(hasOAuthScopes(granted, ["forms:read"])).toBe(true);
    expect(hasOAuthScopes(granted, ["forms:publish"])).toBe(false);
  });
});
