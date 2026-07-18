import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isHoneypotRejection, validateSubmission } from "@/lib/submission-validation";

const definition = {
  schemaVersion: 1 as const,
  title: "Contact us",
  fields: [
    { id: randomUUID(), key: "name", type: "text" as const, label: "Name", required: true, validation: { minLength: 2 } },
    { id: randomUUID(), key: "email", type: "email" as const, label: "Email", required: true },
    { id: randomUUID(), key: "topic", type: "select" as const, label: "Topic", required: false, options: [{ value: "sales", label: "Sales" }] },
  ],
  confirmation: { message: "Thanks" },
};

describe("validateSubmission", () => {
  it("normalizes valid values and drops platform fields", () => {
    expect(validateSubmission(definition, { name: "  Ada  ", email: "ADA@example.com", topic: "sales", _submission_id: randomUUID() })).toEqual({
      success: true,
      values: { name: "Ada", email: "ADA@example.com", topic: "sales" },
    });
  });

  it("reports required, type and option errors without accepting unknown fields", () => {
    const result = validateSubmission(definition, { email: "not-email", topic: "support", surprise: "x" });
    expect(result).toEqual({
      success: false,
      errors: { name: "Name is required.", email: "Enter a valid email address.", topic: "Choose a valid option." },
    });
  });

  it("requires a conditional answer only while its earlier rule matches", () => {
    const conditionalDefinition = {
      ...definition,
      fields: [
        { id: randomUUID(), key: "needs_help", type: "yes_no" as const, label: "Need help?", required: true },
        { id: randomUUID(), key: "details", type: "textarea" as const, label: "Tell us more", required: true, condition: { fieldKey: "needs_help", operator: "equals" as const, value: "yes" } },
      ],
    };
    expect(validateSubmission(conditionalDefinition, { needs_help: "no", details: "spoofed" })).toEqual({ success: true, values: { needs_help: "no" } });
    expect(validateSubmission(conditionalDefinition, { needs_help: "yes" })).toEqual({ success: false, errors: { details: "Tell us more is required." } });
  });

  it("collects declared hidden context without making it a visible requirement", () => {
    const contextual = { ...definition, fields: [...definition.fields, { id: randomUUID(), key: "campaign", type: "text" as const, label: "Campaign", hidden: true, defaultValue: "summer" }] };
    expect(validateSubmission(contextual, { name: "Ada", email: "ada@example.com", campaign: "summer" })).toEqual({ success: true, values: { name: "Ada", email: "ada@example.com", campaign: "summer" } });
  });
});

describe("isHoneypotRejection", () => {
  it("does not reject the Turnstile-protected hosted form when autofill touches the trap", () => {
    expect(isHoneypotRejection({ value: "autofilled", origin: "https://jobing.site" })).toBe(false);
  });

  it("does not discard a real external browser submission when autofill touches the trap", () => {
    expect(isHoneypotRejection({ value: "autofilled", origin: "https://example.com" })).toBe(false);
  });

  it("rejects an originless scripted request that fills the trap", () => {
    expect(isHoneypotRejection({ value: "spam", origin: null })).toBe(true);
  });
});
