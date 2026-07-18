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

export const formFieldInputSchema = z.object({
  key: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/).describe("Stable lowercase key, for example work_email."),
  type: z.enum(["text", "email", "textarea", "number", "tel", "url", "date", "time", "select", "radio", "checkbox", "consent", "file", "rating", "yes_no"]),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  placeholder: z.string().trim().max(200).optional(),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  defaultValue: z.string().max(2_000).optional().describe("Static context saved with every response. Only valid when hidden is true; the generated page may replace it dynamically."),
  condition: z.object({
    fieldKey: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/),
    operator: z.enum(["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty", "greater_than", "less_than"]),
    value: z.string().max(500).optional(),
  }).optional().describe("Optionally show this field only when an earlier field matches. Use stable field keys."),
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
  if (field.condition && !["is_empty", "is_not_empty"].includes(field.condition.operator) && !field.condition.value?.trim()) {
    context.addIssue({ code: "custom", path: ["condition", "value"], message: `${field.condition.operator} requires a comparison value.` });
  }
  if (field.defaultValue !== undefined && !field.hidden) context.addIssue({ code: "custom", path: ["defaultValue"], message: "defaultValue is only supported on hidden fields." });
  if (field.hidden && field.type === "file") context.addIssue({ code: "custom", path: ["hidden"], message: "File uploads cannot be hidden fields." });
});

const presentationInputSchema = z.object({
  colorMode: z.enum(["dark", "light"]),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontFamily: z.enum(["sans", "serif", "mono"]),
  spacing: z.enum(["compact", "comfortable", "spacious"]),
  buttonStyle: z.enum(["solid", "outline"]),
});

const behaviorInputSchema = z.object({
  acceptResponses: z.boolean().optional().describe("Set false to pause new responses."),
  opensAt: z.string().datetime({ offset: true }).nullable().optional().describe("Optional ISO 8601 opening time. Use null while editing to remove it."),
  closesAt: z.string().datetime({ offset: true }).nullable().optional().describe("Optional ISO 8601 closing time. Use null while editing to remove it."),
  responseLimit: z.number().int().min(1).max(1_000_000).nullable().optional().describe("Optional exact lifetime response cap. Use null while editing to remove it."),
  closedMessage: z.string().trim().min(1).max(1_000).optional(),
  showProgress: z.boolean().optional(),
  submitButtonLabel: z.string().trim().min(1).max(80).optional(),
}).superRefine((behavior, context) => {
  if (behavior.opensAt && behavior.closesAt && new Date(behavior.opensAt) >= new Date(behavior.closesAt)) {
    context.addIssue({ code: "custom", path: ["closesAt"], message: "Closing time must be after opening time." });
  }
});

function validateFieldConditions(fields: Array<{ key: string; hidden?: boolean; condition?: { fieldKey: string } }>, context: z.RefinementCtx) {
  const seen = new Map<string, { hidden?: boolean }>();
  fields.forEach((field, index) => {
    if (field.condition) {
      const source = seen.get(field.condition.fieldKey);
      if (!source) context.addIssue({ code: "custom", path: ["fields", index, "condition", "fieldKey"], message: "Conditions can only use an earlier field key." });
      else if (source.hidden) context.addIssue({ code: "custom", path: ["fields", index, "condition", "fieldKey"], message: "A hidden field cannot control another field." });
    }
    seen.set(field.key, field);
  });
}

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
  presentation: presentationInputSchema.optional().describe("Optional styling for the hosted form. Native HTML embedded in a custom page can be styled freely with page CSS."),
  behavior: behaviorInputSchema.optional().describe("Optional response scheduling, cap, progress, and button behavior."),
}).superRefine((input, context) => {
  const keys = new Set<string>();
  input.fields.forEach((field, index) => {
    if (keys.has(field.key)) {
      context.addIssue({ code: "custom", path: ["fields", index, "key"], message: "Field keys must be unique." });
    }
    keys.add(field.key);
  });
  validateFieldConditions(input.fields, context);
});

export type CreateFormDraftToolInput = z.output<typeof createFormDraftToolInputSchema>;

export const updateFormDraftToolInputSchema = z.object({
  formId: z.string().uuid(),
  expectedRevision: z.number().int().positive().describe("Current revision returned by list_forms. The edit is rejected if the form changed after it was read."),
  name: z.string().trim().min(1).max(200).describe("Dashboard name for the form."),
  title: z.string().trim().min(1).max(200).describe("Heading respondents will see."),
  description: z.string().trim().max(2_000).nullable().optional().describe("New description. Use null to remove it; omit to keep the current description."),
  fields: z.array(formFieldInputSchema).min(1).max(100).describe("The complete desired field list. Existing field IDs are preserved by matching stable field keys."),
  confirmationMessage: z.string().trim().min(1).max(1_000).optional().describe("Omit to keep the current confirmation message."),
  redirectUrl: z.string().url().refine((value) => new URL(value).protocol === "https:", "Use an HTTPS redirect URL.").nullable().optional()
    .describe("New redirect URL. Use null to remove it; omit to keep the current redirect."),
  allowedOrigins: z.array(z.string().url().transform((value) => new URL(value).origin)).max(20).optional()
    .describe("Complete allowed-origin list. Omit to keep the current list."),
  presentation: presentationInputSchema.optional().describe("Complete hosted-form styling. Omit to keep the current styling."),
  behavior: behaviorInputSchema.optional().describe("Behavior values to change. Omitted values keep their current settings."),
}).superRefine((input, context) => {
  const keys = new Set<string>();
  input.fields.forEach((field, index) => {
    if (keys.has(field.key)) context.addIssue({ code: "custom", path: ["fields", index, "key"], message: "Field keys must be unique." });
    keys.add(field.key);
  });
  validateFieldConditions(input.fields, context);
});

export type UpdateFormDraftToolInput = z.output<typeof updateFormDraftToolInputSchema>;

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
        ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}),
        ...(field.condition ? { condition: field.condition } : {}),
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
      ...((input.allowedOrigins || input.behavior) ? { settings: {
        allowedOrigins: input.allowedOrigins ?? [],
        ...(input.behavior?.acceptResponses !== undefined ? { acceptResponses: input.behavior.acceptResponses } : {}),
        ...(input.behavior?.opensAt ? { opensAt: input.behavior.opensAt } : {}),
        ...(input.behavior?.closesAt ? { closesAt: input.behavior.closesAt } : {}),
        ...(input.behavior?.responseLimit ? { responseLimit: input.behavior.responseLimit } : {}),
        ...(input.behavior?.closedMessage ? { closedMessage: input.behavior.closedMessage } : {}),
        ...(input.behavior?.showProgress !== undefined ? { showProgress: input.behavior.showProgress } : {}),
        ...(input.behavior?.submitButtonLabel ? { submitButtonLabel: input.behavior.submitButtonLabel } : {}),
      } } : {}),
      ...(input.presentation ? { presentation: input.presentation } : {}),
    },
  };
}

export function buildUpdatedConnectorFormDraft(
  input: UpdateFormDraftToolInput,
  current: CreateConnectorFormInput,
): CreateConnectorFormInput {
  const existingFieldIds = new Map(current.definition.fields.map((field) => [field.key, field.id]));
  const description = input.description === undefined ? current.definition.description : input.description ?? undefined;
  const redirectUrl = input.redirectUrl === undefined
    ? current.definition.confirmation?.redirectUrl
    : input.redirectUrl ?? undefined;

  return {
    name: input.name,
    ...(description !== undefined ? { description } : {}),
    definition: {
      schemaVersion: 1,
      title: input.title,
      ...(description !== undefined ? { description } : {}),
      fields: input.fields.map((field, index) => ({
        id: existingFieldIds.get(field.key)
          ?? deterministicFormFieldId(`update:${input.formId}:${input.expectedRevision}`, index, field.key),
        key: field.key,
        type: field.type,
        label: field.label,
        ...(field.description !== undefined ? { description: field.description } : {}),
        ...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {}),
        required: field.required,
        hidden: field.hidden,
        ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}),
        ...(field.condition ? { condition: field.condition } : {}),
        ...(field.options !== undefined ? { options: field.options } : {}),
        ...(field.validation !== undefined ? { validation: field.validation } : {}),
      })),
      confirmation: {
        title: current.definition.confirmation?.title ?? "Response received",
        message: input.confirmationMessage
          ?? current.definition.confirmation?.message
          ?? "Thanks, your response was received.",
        ...(redirectUrl ? { redirectUrl } : {}),
      },
      settings: {
        allowedOrigins: input.allowedOrigins ?? current.definition.settings?.allowedOrigins ?? [],
        acceptResponses: input.behavior?.acceptResponses ?? current.definition.settings?.acceptResponses ?? true,
        ...(input.behavior?.opensAt === null ? {} : input.behavior?.opensAt !== undefined ? { opensAt: input.behavior.opensAt } : current.definition.settings?.opensAt ? { opensAt: current.definition.settings.opensAt } : {}),
        ...(input.behavior?.closesAt === null ? {} : input.behavior?.closesAt !== undefined ? { closesAt: input.behavior.closesAt } : current.definition.settings?.closesAt ? { closesAt: current.definition.settings.closesAt } : {}),
        ...(input.behavior?.responseLimit === null ? {} : input.behavior?.responseLimit !== undefined ? { responseLimit: input.behavior.responseLimit } : current.definition.settings?.responseLimit !== undefined ? { responseLimit: current.definition.settings.responseLimit } : {}),
        closedMessage: input.behavior?.closedMessage ?? current.definition.settings?.closedMessage ?? "This form is not accepting responses right now.",
        showProgress: input.behavior?.showProgress ?? current.definition.settings?.showProgress ?? false,
        submitButtonLabel: input.behavior?.submitButtonLabel ?? current.definition.settings?.submitButtonLabel ?? "Send response",
      },
      ...(input.presentation ?? current.definition.presentation
        ? { presentation: input.presentation ?? current.definition.presentation! }
        : {}),
    },
  };
}
