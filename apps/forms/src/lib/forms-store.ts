import "server-only";

import { z } from "zod";
import { databaseConfigured, query } from "@/lib/db";
import type { CreateFormDraftRequest, PublishFormRequest, WorkspaceProjectionRequest } from "@/lib/form-definition";
import { sha256Hex } from "@/lib/internal-auth";

const formSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["draft", "published", "paused", "archived", "trashed"]),
  revision: z.coerce.number().int().positive(),
  publishedVersion: z.coerce.number().int().nonnegative(),
  endpointId: z.string(),
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

export async function listFormsForActor(actorId: string): Promise<FormSummary[]> {
  if (!databaseConfigured()) return [];
  const result = await query<{ value: unknown }>("select value from forms_api.list_forms($1) as value", [actorId]);
  return result.rows.map((row) => formSummarySchema.parse(row.value));
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
