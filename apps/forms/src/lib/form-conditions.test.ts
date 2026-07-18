import { describe, expect, it } from "vitest";
import { conditionMatches, formAvailability } from "./form-conditions";
import { formDefinitionSchema } from "./form-definition";

describe("form conditions", () => {
  it("matches scalar, multi-select, empty and numeric answers", () => {
    expect(conditionMatches({ fieldKey: "topic", operator: "equals", value: "sales" }, { topic: "sales" })).toBe(true);
    expect(conditionMatches({ fieldKey: "topics", operator: "contains", value: "port" }, { topics: ["support", "billing"] })).toBe(true);
    expect(conditionMatches({ fieldKey: "company", operator: "is_empty" }, {})).toBe(true);
    expect(conditionMatches({ fieldKey: "team_size", operator: "greater_than", value: "10" }, { team_size: "11" })).toBe(true);
  });

  it("reports scheduled, paused, and capped forms as unavailable", () => {
    const definition = formDefinitionSchema.parse({ schemaVersion: 1, title: "Applications", fields: [{ id: crypto.randomUUID(), key: "name", type: "text", label: "Name" }], settings: { responseLimit: 2 } });
    expect(formAvailability(definition, 2).accepting).toBe(false);
    expect(formAvailability({ ...definition, settings: { ...definition.settings, responseLimit: undefined, acceptResponses: false } }, 0).accepting).toBe(false);
    expect(formAvailability({ ...definition, settings: { ...definition.settings, responseLimit: undefined, opensAt: "2099-01-01T00:00:00.000Z" } }, 0).accepting).toBe(false);
  });
});
