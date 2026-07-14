import "server-only";

import { z } from "zod";
import { databaseConfigured, query } from "@/lib/db";
import { formDefinitionSchema, type CreateFormDraftRequest, type FormDefinition, type PublishFormRequest, type WorkspaceProjectionRequest } from "@/lib/form-definition";
import { sha256Hex } from "@/lib/internal-auth";

const formSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["draft", "published", "paused", "archived", "trashed"]),
  revision: z.coerce.number().int().positive(),
  publishedVersion: z.coerce.number().int().nonnegative(),
  endpointId: z.string(),
  definition: z.unknown().optional(),
  updatedAt: z.string(),
});

const createResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.literal("draft"),
  revision: z.coerce.number().int().positive(),
  endpointId: z.string(),
});

const publishResultSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("published"),
  revision: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
  endpointId: z.string(),
});

export type FormSummary = z.infer<typeof formSummarySchema>;
export type EditableForm = Omit<FormSummary, "definition"> & { definition: FormDefinition };

const publicFormSchema = z.object({
  formId: z.string().uuid(), endpointId: z.string(), versionId: z.string().uuid(),
  version: z.coerce.number().int().positive(), name: z.string(), definition: z.unknown(),
});

const submissionFileSchema = z.object({
  id: z.string().uuid(), submissionId: z.string().uuid(), fieldKey: z.string(), fileName: z.string(), contentType: z.string(),
  byteSize: z.coerce.number().int().positive(), scanStatus: z.enum(["unscanned", "clean", "blocked"]),
});

const submissionSummarySchema = z.object({
  id: z.string().uuid(), formId: z.string().uuid(), receivedAt: z.string(), values: z.record(z.string(), z.unknown()),
  reviewState: z.enum(["inbox", "spam", "archived"]).default("inbox"), fileCount: z.coerce.number().int().nonnegative().default(0),
  files: z.array(submissionFileSchema).default([]),
});

const paginatedSubmissionsSchema = z.object({
  items: z.array(submissionSummarySchema), total: z.coerce.number().int().nonnegative(), page: z.coerce.number().int().positive(),
  pageSize: z.coerce.number().int().positive(), pages: z.coerce.number().int().positive(),
});

const blockedSubmissionSchema = z.object({
  id: z.string().uuid(), reason: z.string(), origin: z.string().nullable(), eventCount: z.coerce.number().int().positive(), lastOccurredAt: z.string(),
});

const paginatedBlockedSchema = z.object({
  items: z.array(blockedSubmissionSchema), total: z.coerce.number().int().nonnegative(), page: z.coerce.number().int().positive(),
  pageSize: z.coerce.number().int().positive(), pages: z.coerce.number().int().positive(),
});

const dashboardFormResultSchema = z.object({
  id: z.string().uuid(), name: z.string(), status: z.enum(["draft", "published", "paused", "archived", "trashed"]),
  revision: z.coerce.number().int().positive(), endpointId: z.string(), definition: z.unknown().optional(),
});

function idempotencyRequestHash(value: unknown) {
  return sha256Hex(JSON.stringify(value));
}

export async function claimRequestNonce(keyId: string, nonce: string, expiresAt: Date) {
  const result = await query<{ claimed: boolean }>(
    "select forms_api.claim_request_nonce($1, $2, $3) as claimed",
    [keyId, nonce, expiresAt.toISOString()],
  );
  return result.rows[0]?.claimed === true;
}

export async function listFormsForActor(actorId: string): Promise<EditableForm[]> {
  if (!databaseConfigured()) return [];
  const result = await query<{ value: unknown }>("select value from forms_api.list_forms($1) as value", [actorId]);
  return result.rows.map((row) => {
    const parsed = formSummarySchema.parse(row.value);
    return { ...parsed, definition: formDefinitionSchema.parse(parsed.definition) };
  });
}

export async function getPublicForm(endpointId: string) {
  const result = await query<{ value: unknown }>("select forms_api.get_public_form($1) as value", [endpointId]);
  if (!result.rows[0]?.value) return null;
  const publicForm = publicFormSchema.parse(result.rows[0].value);
  return { ...publicForm, definition: (await import("@/lib/form-definition")).formDefinitionSchema.parse(publicForm.definition) };
}

export type SubmissionUpload = { fieldKey: string; fileName: string; contentType: string; contentBase64: string };

export async function acceptSubmission(input: { endpointId: string; idempotencyKey: string; values: Record<string, string | string[]>; origin: string | null; ipHash: string; files?: SubmissionUpload[] }) {
  const result = await query<{ value: unknown }>(
    "select forms_api.accept_submission_v2($1,$2,$3::jsonb,$4,$5,$6::jsonb) as value",
    [input.endpointId, input.idempotencyKey, JSON.stringify(input.values), input.origin, input.ipHash, JSON.stringify(input.files ?? [])],
  );
  return z.object({ submissionId: z.string().uuid(), message: z.string(), redirectUrl: z.string().nullable(), fileCount: z.coerce.number().int().nonnegative() }).parse(result.rows[0]?.value);
}

export async function listSubmissionsForActor(actorId: string, formId: string) {
  const result = await query<{ value: unknown }>("select value from forms_api.list_submissions($1,$2::uuid,50) as value", [actorId, formId]);
  return result.rows.map((row) => submissionSummarySchema.parse(row.value));
}

export async function listSubmissionsPage(input: { actorId: string; formId: string; query?: string; state?: "inbox" | "spam" | "archived"; sort?: "newest" | "oldest"; page?: number; pageSize?: number }) {
  const result = await query<{ value: unknown }>(
    "select forms_api.list_submissions_v2($1,$2::uuid,$3,$4,$5,$6,$7) as value",
    [input.actorId, input.formId, input.query ?? "", input.state ?? "inbox", input.sort ?? "newest", input.page ?? 1, input.pageSize ?? 20],
  );
  return paginatedSubmissionsSchema.parse(result.rows[0]?.value);
}

export async function listBlockedSubmissions(input: { actorId: string; formId: string; page?: number; pageSize?: number }) {
  const result = await query<{ value: unknown }>("select forms_api.list_blocked_submissions($1,$2::uuid,$3,$4) as value", [input.actorId, input.formId, input.page ?? 1, input.pageSize ?? 20]);
  return paginatedBlockedSchema.parse(result.rows[0]?.value);
}

export async function setSubmissionReviewState(actorId: string, submissionId: string, state: "inbox" | "spam" | "archived") {
  const result = await query<{ changed: boolean }>("select forms_api.set_submission_review_state($1,$2::uuid,$3) as changed", [actorId, submissionId, state]);
  return result.rows[0]?.changed === true;
}

export async function listSubmissionFiles(actorId: string, submissionId: string) {
  const result = await query<{ value: unknown }>("select value from forms_api.list_submission_files($1,$2::uuid) as value", [actorId, submissionId]);
  return result.rows.map((row) => submissionFileSchema.parse(row.value));
}

export async function getSubmissionFile(actorId: string, fileId: string) {
  const result = await query<{ value: unknown }>("select forms_api.get_submission_file($1,$2::uuid) as value", [actorId, fileId]);
  if (!result.rows[0]?.value) return null;
  return z.object({ fileName: z.string(), contentType: z.string(), byteSize: z.coerce.number().int().positive(), scanStatus: z.enum(["unscanned", "clean", "blocked"]), contentBase64: z.string() }).parse(result.rows[0].value);
}

export async function recordBlockedSubmission(input: { endpointId: string; reason: string; origin: string | null; ipHash: string }) {
  await query("select forms_api.record_blocked_submission($1,$2,$3,$4)", [input.endpointId, input.reason, input.origin, input.ipHash]);
}

export async function createDashboardForm(actorId: string, name: string, definition: FormDefinition) {
  const result = await query<{ value: unknown }>("select forms_api.create_dashboard_form($1,$2,$3::jsonb) as value", [actorId, name, JSON.stringify(definition)]);
  return dashboardFormResultSchema.parse(result.rows[0]?.value);
}

export async function updateDashboardForm(input: { actorId: string; formId: string; expectedRevision: number; name: string; description?: string; definition: FormDefinition }) {
  const result = await query<{ value: unknown }>("select forms_api.update_dashboard_form($1,$2::uuid,$3,$4,$5,$6::jsonb) as value", [input.actorId, input.formId, input.expectedRevision, input.name, input.description ?? null, JSON.stringify(input.definition)]);
  const parsed = dashboardFormResultSchema.parse(result.rows[0]?.value);
  return { ...parsed, definition: formDefinitionSchema.parse(parsed.definition) };
}

export async function duplicateDashboardForm(actorId: string, formId: string) {
  const result = await query<{ value: unknown }>("select forms_api.duplicate_dashboard_form($1,$2::uuid) as value", [actorId, formId]);
  return dashboardFormResultSchema.parse(result.rows[0]?.value);
}

export async function publishDashboardForm(actorId: string, formId: string, expectedRevision: number) {
  const result = await query<{ value: unknown }>("select forms_api.publish_dashboard_form($1,$2::uuid,$3) as value", [actorId, formId, expectedRevision]);
  return publishResultSchema.parse(result.rows[0]?.value);
}

export async function createFormDraft(input: CreateFormDraftRequest) {
  const stableRequestHash = idempotencyRequestHash({
    operationId: input.operationId,
    actor: {
      userId: input.actor.userId,
      clientId: input.actor.clientId,
      grantId: input.actor.grantId,
    },
    form: input.form,
  });
  const result = await query<{ value: unknown }>(
    "select forms_api.create_form_draft($1, $2, $3::uuid, $4, $5, $6, $7, $8::jsonb) as value",
    [
      input.actor.userId,
      input.actor.clientId,
      input.actor.grantId,
      input.operationId,
      stableRequestHash,
      input.form.name,
      input.form.description ?? null,
      JSON.stringify(input.form.definition),
    ],
  );
  return createResultSchema.parse(result.rows[0]?.value);
}

export async function publishForm(formId: string, input: PublishFormRequest) {
  const stableRequestHash = idempotencyRequestHash({
    operationId: input.operationId,
    actor: {
      userId: input.actor.userId,
      clientId: input.actor.clientId,
      grantId: input.actor.grantId,
    },
    formId,
    expectedRevision: input.expectedRevision,
  });
  const result = await query<{ value: unknown }>(
    "select forms_api.publish_form($1, $2::uuid, $3, $4, $5, $6, $7::uuid) as value",
    [input.actor.userId, formId, input.expectedRevision, input.operationId, stableRequestHash, input.actor.clientId, input.actor.grantId],
  );
  return publishResultSchema.parse(result.rows[0]?.value);
}

export async function applyWorkspaceProjection(input: WorkspaceProjectionRequest, rawBody: string) {
  const result = await query<{ value: unknown }>(
    "select forms_api.apply_workspace_projection($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6) as value",
    [
      input.operationId,
      sha256Hex(rawBody),
      JSON.stringify(input.workspace),
      JSON.stringify(input.membership),
      JSON.stringify(input.entitlement),
      input.membership.actorId,
    ],
  );
  return z.object({ workspaceId: z.string().uuid(), applied: z.boolean() }).parse(result.rows[0]?.value);
}
