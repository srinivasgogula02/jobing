import { z } from "zod";
import { updateFormDraftRequestSchema } from "@/lib/form-definition";
import { updateDashboardForm } from "@/lib/forms-store";
import { InternalRouteError, internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ formId: string }> }) {
  try {
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    const path = `/forms/api/internal/v1/forms/${formId.data}/draft`;
    const { data } = await readInternalJson(request, updateFormDraftRequestSchema, path);
    requireInternalScope(data.actor, "forms:write");
    const form = await updateDashboardForm({
      actorId: data.actor.userId,
      formId: formId.data,
      expectedRevision: data.expectedRevision,
      name: data.name,
      description: data.description,
      definition: data.definition,
    });
    return internalDataResponse(form);
  } catch (error) {
    return internalErrorResponse(error, { operation: "forms.update" });
  }
}
