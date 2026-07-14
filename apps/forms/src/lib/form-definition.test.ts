import { describe, expect, it } from "vitest";
import { formDefinitionSchema } from "./form-definition";

function field(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    key: "email",
    type: "email",
    label: "Email",
    required: true,
    ...overrides,
  };
}

describe("form definition schema", () => {
  it("accepts a bounded versioned definition", () => {
    const result = formDefinitionSchema.parse({ schemaVersion: 1, title: "Contact", fields: [field()] });
    expect(result.confirmation.message).toContain("response was received");
  });

  it("rejects duplicate stable field keys", () => {
    const result = formDefinitionSchema.safeParse({
      schemaVersion: 1,
      title: "Contact",
      fields: [field(), field({ id: crypto.randomUUID() })],
    });
    expect(result.success).toBe(false);
  });

  it("requires options only for choice fields", () => {
    expect(formDefinitionSchema.safeParse({ schemaVersion: 1, title: "Survey", fields: [field({ type: "select" })] }).success).toBe(false);
    expect(formDefinitionSchema.safeParse({ schemaVersion: 1, title: "Survey", fields: [field({ options: [{ value: "x", label: "X" }] })] }).success).toBe(false);
  });
});
