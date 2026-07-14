import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireConnectorActor } from "./connector-auth";

describe("connector tool authorization", () => {
  const grantId = "5df42931-5953-42a0-bd90-7581a79326db";
  const base = { clientId: "client_123", extra: { userId: "user_123", grantId } };

  it("returns the actor only when the exact canonical permission is present", () => {
    expect(requireConnectorActor({ ...base, scopes: ["forms:read", "forms:write"] }, "forms:write"))
      .toEqual({
        userId: "user_123",
        clientId: "client_123",
        grantId,
        scopes: ["forms:read", "forms:write"],
      });
  });

  it("does not let a read grant publish or create", () => {
    expect(() => requireConnectorActor({ ...base, scopes: ["forms:read"] }, "forms:write"))
      .toThrow("has not been granted forms:write");
    expect(() => requireConnectorActor({ ...base, scopes: ["forms:read"] }, "forms:publish"))
      .toThrow("has not been granted forms:publish");
  });

  it("maps a legacy mcp grant to notes and pages but never Forms", () => {
    expect(requireConnectorActor({ ...base, scopes: ["mcp"] }, "notes:write").scopes)
      .toEqual(["notes:write", "pages:write"]);
    expect(() => requireConnectorActor({ ...base, scopes: ["mcp"] }, "forms:read"))
      .toThrow("has not been granted forms:read");
    expect(() => requireConnectorActor({ ...base, scopes: ["mcp"] }, "feedback:write"))
      .toThrow("has not been granted feedback:write");
  });

  it("allows feedback only through the explicit feedback permission", () => {
    expect(requireConnectorActor({ ...base, scopes: ["feedback:write"] }, "feedback:write"))
      .toMatchObject({ userId: "user_123", grantId });
    expect(() => requireConnectorActor({ ...base, scopes: ["pages:write"] }, "feedback:write"))
      .toThrow("has not been granted feedback:write");
  });

  it("fails closed when identity context is incomplete", () => {
    expect(() => requireConnectorActor({ scopes: ["forms:write"] }, "forms:write"))
      .toThrow("could not be identified");
    expect(() => requireConnectorActor({
      clientId: "client_123",
      scopes: ["forms:write"],
      extra: { userId: "user_123", grantId: "not-a-uuid" },
    }, "forms:write")).toThrow("could not be identified");
  });
});
