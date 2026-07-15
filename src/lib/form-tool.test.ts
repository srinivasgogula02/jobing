import { describe, expect, it } from "vitest";
import {
  buildConnectorFormDraft,
  buildUpdatedConnectorFormDraft,
  createFormDraftToolInputSchema,
  deterministicFormFieldId,
  updateFormDraftToolInputSchema,
} from "./form-tool";

const input = {
  operationId: "chat-turn:contact-form:v1",
  name: "Contact",
  title: "Contact us",
  fields: [
    { key: "email", type: "email" as const, label: "Email", required: true },
    { key: "message", type: "textarea" as const, label: "Message" },
  ],
};

describe("create form tool input", () => {
  it("requires a caller-supplied stable operation ID", () => {
    expect(createFormDraftToolInputSchema.safeParse({ ...input, operationId: undefined }).success).toBe(false);
    expect(createFormDraftToolInputSchema.safeParse({ ...input, operationId: "short" }).success).toBe(false);
    expect(createFormDraftToolInputSchema.safeParse(input).success).toBe(true);
  });

  it("builds byte-for-byte stable definitions for retries", () => {
    const parsed = createFormDraftToolInputSchema.parse(input);
    const first = buildConnectorFormDraft(parsed);
    const second = buildConnectorFormDraft(createFormDraftToolInputSchema.parse(input));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.definition.fields.map((field) => field.id)).toEqual([
      deterministicFormFieldId(input.operationId, 0, "email"),
      deterministicFormFieldId(input.operationId, 1, "message"),
    ]);
    first.definition.fields.forEach((field) => expect(field.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
  });

  it("changes deterministic field IDs when the operation changes", () => {
    const first = buildConnectorFormDraft(createFormDraftToolInputSchema.parse(input));
    const second = buildConnectorFormDraft(createFormDraftToolInputSchema.parse({
      ...input,
      operationId: "chat-turn:contact-form:v2",
    }));

    expect(first.definition.fields[0].id).not.toBe(second.definition.fields[0].id);
  });

  it("rejects duplicate keys and invalid option shapes before transport", () => {
    expect(createFormDraftToolInputSchema.safeParse({
      ...input,
      fields: [input.fields[0], input.fields[0]],
    }).success).toBe(false);
    expect(createFormDraftToolInputSchema.safeParse({
      ...input,
      fields: [{ key: "topic", type: "select", label: "Topic" }],
    }).success).toBe(false);
  });

  it("normalizes approved origins and rejects unsafe redirects", () => {
    const parsed = createFormDraftToolInputSchema.parse({ ...input, allowedOrigins: ["https://example.com/contact"] });
    expect(buildConnectorFormDraft(parsed).definition.settings).toEqual({ allowedOrigins: ["https://example.com"] });
    expect(createFormDraftToolInputSchema.safeParse({ ...input, redirectUrl: "http://example.com/thanks" }).success).toBe(false);
  });
});

describe("update form tool input", () => {
  it("preserves field IDs by stable key and assigns deterministic IDs to new fields", () => {
    const current = buildConnectorFormDraft(createFormDraftToolInputSchema.parse(input));
    const update = updateFormDraftToolInputSchema.parse({
      formId: "4e279eaf-0a6e-48de-a66e-3c819f3fb756",
      expectedRevision: 1,
      name: "Contact",
      title: "Contact our team",
      fields: [
        { key: "email", type: "email", label: "Work email", required: true },
        { key: "company", type: "text", label: "Company" },
      ],
    });

    const result = buildUpdatedConnectorFormDraft(update, current);
    expect(result.definition.fields[0].id).toBe(current.definition.fields[0].id);
    expect(result.definition.fields[1].id).toBe(
      deterministicFormFieldId(`update:${update.formId}:${update.expectedRevision}`, 1, "company"),
    );
  });

  it("supports clearing redirects and updating hosted-form styling", () => {
    const current = buildConnectorFormDraft(createFormDraftToolInputSchema.parse({
      ...input,
      redirectUrl: "https://example.com/thanks",
    }));
    const update = updateFormDraftToolInputSchema.parse({
      formId: "4e279eaf-0a6e-48de-a66e-3c819f3fb756",
      expectedRevision: 1,
      name: "Contact",
      title: "Contact us",
      fields: input.fields,
      redirectUrl: null,
      presentation: {
        colorMode: "light",
        accentColor: "#3366FF",
        backgroundColor: "#FFFFFF",
        textColor: "#111111",
        fontFamily: "sans",
        spacing: "comfortable",
        buttonStyle: "solid",
      },
    });

    const result = buildUpdatedConnectorFormDraft(update, current);
    expect(result.definition.confirmation).not.toHaveProperty("redirectUrl");
    expect(result.definition.presentation).toMatchObject({ colorMode: "light", accentColor: "#3366FF" });
  });
});
