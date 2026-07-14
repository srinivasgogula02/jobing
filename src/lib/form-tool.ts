import crypto from "node:crypto";
import { z } from "zod";
import type { CreateConnectorFormInput } from "@/lib/forms-service";

export const formOperationIdSchema = z.string()
  .min(8)
  .max(200)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._~:/-]*$/,
    "Use a stable ASCII operation ID containing letters, numbers, dots, underscores, tildes, colons, slashes, or hyphens.",
  );

const formFieldInputSchema = z.object({
  key: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/).describe("Stable lowercase key, for example work_email."),
  type: z.enum(["text", "email", "textarea", "number", "tel", "url", "date", "select", "radio", "checkbox", "consent", "file"]),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  placeholder: z.string().trim().max(200).optional(),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
  })).min(1).max(100).optional().describe("Required for select, radio, and checkbox fields; omit for all other types."),
  validation: z.object({
    minLength: z.number().int().min(0).max(10_000).optional(),
    maxLength: z.number().int().min(1).max(100_000).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    acceptedFileTypes: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    maxFileSizeMb: z.number().int().min(1).max(2).optional(),
  }).optional(),
}).superRefine((field, context) => {
  const needsOptions = field.type === "select" || field.type === "radio" || field.type === "checkbox";
  if (needsOptions && !field.options?.length) {
    context.addIssue({ code: "custom", path: ["options"], message: `${field.type} fields require options.` });
  }
  if (!needsOptions && field.options) {
    context.addIssue({ code: "custom", path: ["options"], message: `${field.type} fields cannot include options.` });
  }
  if (field.validation?.minLength !== undefined && field.validation.maxLength !== undefined && field.validation.minLength > field.validation.maxLength) {
    context.addIssue({ code: "custom", path: ["validation"], message: "minLength cannot exceed maxLength." });
  }
  if (field.validation?.min !== undefined && field.validation.max !== undefined && field.validation.min > field.validation.max) {
    context.addIssue({ code: "custom", path: ["validation"], message: "min cannot exceed max." });
  }
});

export const createFormDraftToolInputSchema = z.object({
  operationId: formOperationIdSchema.describe("Required stable idempotency key. Reuse it unchanged when retrying the same creation."),
  name: z.string().trim().min(1).max(200).describe("Dashboard name for the form."),
  title: z.string().trim().min(1).max(200).describe("Heading respondents will see."),
  description: z.string().trim().max(2_000).optional(),
  fields: z.array(formFieldInputSchema).min(1).max(100),
  confirmationMessage: z.string().trim().min(1).max(1_000).optional(),
  redirectUrl: z.string().url().refine((value) => new URL(value).protocol === "https:", "Use an HTTPS redirect URL.").optional(),
  allowedOrigins: z.array(z.string().url().transform((value) => new URL(value).origin)).max(20).optional()
    .describe("HTTPS website origins allowed to submit, for example https://example.com. Omit for hosted-form-only use."),
}).superRefine((input, context) => {
  const keys = new Set<string>();
  input.fields.forEach((field, index) => {
    if (keys.has(field.key)) {
      context.addIssue({ code: "custom", path: ["fields", index, "key"], message: "Field keys must be unique." });
    }
    keys.add(field.key);
  });
});

export type CreateFormDraftToolInput = z.output<typeof createFormDraftToolInputSchema>;

function deterministicUuid(seed: string) {
  const bytes = Buffer.from(crypto.createHash("sha256").update(seed, "utf8").digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function deterministicFormFieldId(operationId: string, index: number, key: string) {
  return deterministicUuid(`jobing.forms.field.v1\0${operationId}\0${index}\0${key}`);
}

export function buildConnectorFormDraft(input: CreateFormDraftToolInput): CreateConnectorFormInput {
  return {
    name: input.name,
    ...(input.description !== undefined ? { description: input.description } : {}),
    definition: {
      schemaVersion: 1,
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      fields: input.fields.map((field, index) => ({
        id: deterministicFormFieldId(input.operationId, index, field.key),
        key: field.key,
        type: field.type,
        label: field.label,
        ...(field.description !== undefined ? { description: field.description } : {}),
        ...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {}),
        required: field.required,
        hidden: field.hidden,
        ...(field.options !== undefined ? {
          options: field.options.map((option) => ({ value: option.value, label: option.label })),
        } : {}),
        ...(field.validation !== undefined ? {
          validation: {
            ...(field.validation.minLength !== undefined ? { minLength: field.validation.minLength } : {}),
            ...(field.validation.maxLength !== undefined ? { maxLength: field.validation.maxLength } : {}),
            ...(field.validation.min !== undefined ? { min: field.validation.min } : {}),
            ...(field.validation.max !== undefined ? { max: field.validation.max } : {}),
            ...(field.validation.acceptedFileTypes !== undefined ? { acceptedFileTypes: field.validation.acceptedFileTypes } : {}),
            ...(field.validation.maxFileSizeMb !== undefined ? { maxFileSizeMb: field.validation.maxFileSizeMb } : {}),
          },
        } : {}),
      })),
      confirmation: {
        title: "Response received",
        message: input.confirmationMessage ?? "Thanks, your response was received.",
        ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {}),
      },
      ...(input.allowedOrigins ? { settings: { allowedOrigins: input.allowedOrigins } } : {}),
    },
  };
}
