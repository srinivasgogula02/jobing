import { z } from "zod";
import { setFormResponseStateRequestSchema } from "@/lib/form-definition";
import { setSubmissionReviewState } from "@/lib/forms-store";
import { InternalRouteError, internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const submissionIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ submissionId: string }> }) {
  try {
    const { submissionId: rawSubmissionId } = await context.params;
    const submissionId = submissionIdSchema.safeParse(rawSubmissionId);
    if (!submissionId.success) throw new InternalRouteError(400, "invalid_submission_id", "The response ID is invalid.");
    const path = `/forms/api/internal/v1/responses/${submissionId.data}/state`;
    const { data } = await readInternalJson(request, setFormResponseStateRequestSchema, path);
    requireInternalScope(data.actor, "forms.responses:write");
    const changed = await setSubmissionReviewState(data.actor.userId, submissionId.data, data.state);
    if (!changed) throw new InternalRouteError(404, "response_not_found", "The response was not found.");
    return internalDataResponse({ submissionId: submissionId.data, state: data.state });
  } catch (error) {
    return internalErrorResponse(error, { operation: "responses.update_state" });
  }
}
