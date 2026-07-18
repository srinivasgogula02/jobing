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

  it("supports conditional questions only after their source question", () => {
    const source = field({ key: "needs_help", type: "yes_no" });
    const conditional = field({ key: "details", type: "textarea", condition: { fieldKey: "needs_help", operator: "equals", value: "yes" } });
    expect(formDefinitionSchema.safeParse({ schemaVersion: 1, title: "Intake", fields: [source, conditional] }).success).toBe(true);
    expect(formDefinitionSchema.safeParse({ schemaVersion: 1, title: "Intake", fields: [conditional, source] }).success).toBe(false);
  });

  it("normalizes form behavior defaults and rejects reversed schedules", () => {
    const parsed = formDefinitionSchema.parse({ schemaVersion: 1, title: "Contact", fields: [field()] });
    expect(parsed.settings).toMatchObject({ acceptResponses: true, showProgress: false, submitButtonLabel: "Send response" });
    expect(formDefinitionSchema.safeParse({
      schemaVersion: 1,
      title: "Contact",
      fields: [field()],
      settings: { opensAt: "2026-07-20T10:00:00.000Z", closesAt: "2026-07-19T10:00:00.000Z" },
    }).success).toBe(false);
  });
});
