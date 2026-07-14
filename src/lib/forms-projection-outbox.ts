import "server-only";

import { z } from "zod";
import { FormsServiceError, syncFormsWorkspaceProjection } from "@/lib/forms-service";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const workspaceProjectionSchema = z.object({
  operationId: z.string().min(8).max(200),
  workspace: z.object({
    sourceWorkspaceId: z.string().min(1).max(160),
    kind: z.enum(["personal", "team"]),
    displayName: z.string().min(1).max(160),
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
    features: z.record(z.string(), z.unknown()),
    limits: z.record(z.string(), z.number().int().nonnegative().nullable()),
  }),
});

const claimedProjectionSchema = z.object({
  id: z.string().uuid(),
  eventKey: z.string(),
  leaseToken: z.string().uuid(),
  payload: workspaceProjectionSchema,
  attempts: z.number().int().positive(),
});

export type WorkspaceProjection = z.infer<typeof workspaceProjectionSchema>;

function deliveryErrorCode(error: unknown) {
  const value = error instanceof FormsServiceError ? error.code : "delivery_failed";
  return /^[a-z0-9_.-]{1,120}$/i.test(value) ? value : "delivery_failed";
}

async function rpc(name: string, input: Record<string, unknown>) {
  const result = await getSupabaseAdmin().rpc(name, input);
  if (result.error) {
    console.error(`[forms/outbox] ${name} failed`, { code: result.error.code });
    throw new Error("The Forms lifecycle outbox could not be updated.");
  }
  return result.data as unknown;
}

export async function enqueueUserDeletionProjection(input: {
  userId: string;
  eventKey: string;
  sourceVersion: number;
}) {
  const payload = await rpc("jobing_delete_user_and_enqueue_forms", {
    p_user_id: input.userId,
    p_event_key: input.eventKey,
    p_source_version: input.sourceVersion,
  });
  return workspaceProjectionSchema.parse(payload);
}

/**
 * Commit the deletion to the main database first, then make a fast delivery
 * attempt. Failure is safe: the durable outbox remains pending for retries.
 */
export async function enqueueAndDeliverUserDeletion(input: {
  userId: string;
  eventKey: string;
  sourceVersion: number;
}) {
  const payload = await enqueueUserDeletionProjection(input);
  await syncFormsWorkspaceProjection(payload);
  const acknowledged = await rpc("forms_ack_workspace_projection_event", {
    p_event_key: input.eventKey,
  });
  if (acknowledged !== true) throw new Error("The Forms lifecycle event could not be acknowledged.");
  return payload;
}

async function deliverClaim(claim: z.infer<typeof claimedProjectionSchema>) {
  try {
    await syncFormsWorkspaceProjection(claim.payload);
    const acknowledged = await rpc("forms_ack_workspace_projection", {
      p_id: claim.id,
      p_lease_token: claim.leaseToken,
    });
    if (acknowledged !== true) throw new Error("The Forms lifecycle lease expired before acknowledgement.");
    return true;
  } catch (error) {
    await rpc("forms_nack_workspace_projection", {
      p_id: claim.id,
      p_lease_token: claim.leaseToken,
      p_error_code: deliveryErrorCode(error),
    }).catch(() => undefined);
    return false;
  }
}

export async function drainFormsProjectionOutbox(limit = 25) {
  const claimed = z.array(claimedProjectionSchema).parse(await rpc("forms_claim_workspace_projections", {
    p_limit: limit,
    p_lease_seconds: 60,
  }));

  // Small parallel batches prevent one network timeout from consuming the
  // entire cron window without stampeding the Forms service.
  let delivered = 0;
  for (let index = 0; index < claimed.length; index += 5) {
    const results = await Promise.all(claimed.slice(index, index + 5).map(deliverClaim));
    delivered += results.filter(Boolean).length;
  }

  return {
    claimed: claimed.length,
    delivered,
    failed: claimed.length - delivered,
  };
}
