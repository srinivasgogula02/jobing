import { z } from "zod";
import { publishFormRequestSchema } from "@/lib/form-definition";
import { getFormForActor, publishForm } from "@/lib/forms-store";
import { InternalRouteError, internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ formId: string }> }) {
  try {
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) {
      throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    }
    const { data } = await readInternalJson(
      request,
      publishFormRequestSchema,
      `/forms/api/internal/v1/forms/${formId.data}/publish`,
    );

    requireInternalScope(data.actor, "forms:publish");
    const published = await publishForm(formId.data, data);
    const form = await getFormForActor(data.actor.userId, formId.data);
    if (!form) throw new InternalRouteError(502, "invalid_response", "The published form could not be loaded.");
    return internalDataResponse({ ...published, definition: form.definition });
  } catch (error) {
    return internalErrorResponse(error, { operation: "forms.publish" });
  }
}
