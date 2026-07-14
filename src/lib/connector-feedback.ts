import "server-only";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const reportResultSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  duplicate: z.boolean(),
});

const PRIVATE_FEEDBACK_CONTENT = [
  /[\r\n\u0000-\u001f\u007f]/u,
  /<[^>]*>/u,
  /(?:https?:\/\/|www\.)/iu,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /(?:\+?\d[\d ().-]{6,}\d)/u,
  /\b(?:api[ _-]?key|access[ _-]?token|bearer|password|secret)\s*[:=]/iu,
];

function isPrivacySafeSummary(value: string) {
  return PRIVATE_FEEDBACK_CONTENT.every((pattern) => !pattern.test(value));
}

export const connectorFeedbackInputSchema = z.object({
  operationId: z.string().min(8).max(200).regex(
    /^[A-Za-z0-9][A-Za-z0-9._~:/-]*$/,
    "Use a stable ASCII operation ID containing letters, numbers, dots, underscores, tildes, colons, slashes, or hyphens.",
  ),
  kind: z.enum(["missing_capability", "bug", "workflow_friction", "idea", "other"]),
  useCase: z.enum(["website", "lead_generation", "job_application", "event_registration", "survey", "portfolio", "form_only", "other"]),
  blockedTool: z.enum(["create_note", "deploy_page", "create_form_draft", "list_forms", "publish_form", "other"]).optional(),
  summary: z.string().trim().min(2).max(280).refine(
    isPrivacySafeSummary,
    "Do not include personal data, URLs, HTML, secrets, or conversation text.",
  ),
  userConfirmed: z.literal(true, { error: "Confirm with the user before sending feedback." }),
});

export type ConnectorFeedbackActor = {
  userId: string;
  clientId: string;
  grantId: string;
  scopes: string[];
};

export class ConnectorFeedbackError extends Error {
  constructor(
    public readonly code: "feedback_rate_limited" | "idempotency_conflict" | "unauthorized" | "storage_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "ConnectorFeedbackError";
  }
}

function normalizedStorageError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  if (message.includes("FEEDBACK_RATE_LIMITED")) {
    return new ConnectorFeedbackError("feedback_rate_limited", "Too many feedback reports were sent. Try again later.");
  }
  if (message.includes("FEEDBACK_IDEMPOTENCY_CONFLICT")) {
    return new ConnectorFeedbackError("idempotency_conflict", "This feedback operation ID was already used with different details.");
  }
  if (message.includes("CONNECTOR_FEEDBACK_UNAUTHORIZED")) {
    return new ConnectorFeedbackError("unauthorized", "This connector is not allowed to send product feedback.");
  }
  return new ConnectorFeedbackError("storage_unavailable", "Feedback could not be saved right now.");
}

export type ConnectorFeedbackInput = z.output<typeof connectorFeedbackInputSchema>;

export async function reportConnectorFeedback(
  actor: ConnectorFeedbackActor,
  rawInput: unknown,
) {
  const input = connectorFeedbackInputSchema.parse(rawInput);
  let response: Awaited<ReturnType<ReturnType<typeof getSupabaseAdmin>["rpc"]>>;
  try {
    response = await getSupabaseAdmin().rpc("submit_connector_feedback", {
      p_user_id: actor.userId,
      p_client_id: actor.clientId,
      p_grant_id: actor.grantId,
      p_operation_id: input.operationId,
      p_kind: input.kind,
      p_use_case: input.useCase,
      p_blocked_tool: input.blockedTool ?? null,
      p_summary: input.summary,
      p_user_confirmed: input.userConfirmed,
    });
  } catch {
    throw normalizedStorageError(null);
  }

  const { data, error } = response;

  if (error) throw normalizedStorageError(error);
  const parsed = reportResultSchema.safeParse(data);
  if (!parsed.success) throw normalizedStorageError(null);
  return parsed.data;
}
