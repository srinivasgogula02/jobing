import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "text",
  "email",
  "textarea",
  "number",
  "tel",
  "url",
  "date",
  "select",
  "radio",
  "checkbox",
  "consent",
]);

const optionSchema = z.object({
  value: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
});

export const formFieldSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers, and underscores."),
  type: fieldTypeSchema,
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().default(false),
  options: z.array(optionSchema).min(1).max(100).optional(),
  validation: z.object({
    minLength: z.number().int().min(0).max(10_000).optional(),
    maxLength: z.number().int().min(1).max(100_000).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
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

export const formDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).optional(),
  fields: z.array(formFieldSchema).min(1).max(100),
  confirmation: z.object({
    message: z.string().trim().min(1).max(1_000).default("Thanks — your response was received."),
    redirectUrl: z.string().url().refine((value) => new URL(value).protocol === "https:", "Use an HTTPS redirect URL.").optional(),
  }).default({ message: "Thanks — your response was received." }),
  settings: z.object({
    allowedOrigins: z.array(z.string().url().transform((value) => new URL(value).origin)).max(20).default([]),
  }).optional(),
}).superRefine((definition, context) => {
  const ids = new Set<string>();
  const keys = new Set<string>();
  definition.fields.forEach((field, index) => {
    if (ids.has(field.id)) context.addIssue({ code: "custom", path: ["fields", index, "id"], message: "Field IDs must be unique." });
    if (keys.has(field.key)) context.addIssue({ code: "custom", path: ["fields", index, "key"], message: "Field keys must be unique." });
    ids.add(field.id);
    keys.add(field.key);
  });
});

export const internalActorSchema = z.object({
  userId: z.string().min(1).max(128),
  clientId: z.string().min(1).max(128),
  grantId: z.string().uuid(),
  scopes: z.array(z.string().min(1).max(64)).min(1).max(16),
});

export const createFormDraftRequestSchema = z.object({
  operationId: z.string().min(8).max(200),
  actor: internalActorSchema,
  form: z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2_000).optional(),
    definition: formDefinitionSchema,
  }),
});

export const listFormsRequestSchema = z.object({ actor: internalActorSchema });

export const publishFormRequestSchema = z.object({
  operationId: z.string().min(8).max(200),
  actor: internalActorSchema,
  expectedRevision: z.number().int().positive(),
});

export const workspaceProjectionRequestSchema = z.object({
  operationId: z.string().min(8).max(200),
  workspace: z.object({
    sourceWorkspaceId: z.string().min(1).max(160),
    kind: z.enum(["personal", "team"]),
    displayName: z.string().trim().min(1).max(160),
    status: z.enum(["active", "suspended", "deleting", "deleted"]),
    sourceVersion: z.number().int().nonnegative(),
  }),
  membership: z.object({
    actorId: z.string().min(1).max(128),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
    status: z.enum(["active", "removed"]),
    sourceVersion: z.number().int().nonnegative(),
  }),
  entitlement: z.object({
    planKey: z.string().min(1).max(64),
    status: z.enum(["active", "grace", "suspended", "cancelled"]),
    sourceVersion: z.number().int().nonnegative(),
    features: z.record(z.string(), z.unknown()).default({}),
    limits: z.record(z.string(), z.number().int().nonnegative().nullable()).default({}),
  }),
});

export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type CreateFormDraftRequest = z.infer<typeof createFormDraftRequestSchema>;
export type PublishFormRequest = z.infer<typeof publishFormRequestSchema>;
export type WorkspaceProjectionRequest = z.infer<typeof workspaceProjectionRequestSchema>;
