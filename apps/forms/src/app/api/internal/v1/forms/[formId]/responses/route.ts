import { z } from "zod";
import { listFormResponsesRequestSchema } from "@/lib/form-definition";
import { listSubmissionsPage } from "@/lib/forms-store";
import { InternalRouteError, internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ formId: string }> }) {
  try {
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    const path = `/forms/api/internal/v1/forms/${formId.data}/responses`;
    const { data } = await readInternalJson(request, listFormResponsesRequestSchema, path);
    requireInternalScope(data.actor, "forms.responses:read");
    const responses = await listSubmissionsPage({
      actorId: data.actor.userId,
      formId: formId.data,
      query: data.query,
      state: data.state,
      sort: data.sort,
      page: data.page,
      pageSize: data.pageSize,
    });
    return internalDataResponse(responses);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
