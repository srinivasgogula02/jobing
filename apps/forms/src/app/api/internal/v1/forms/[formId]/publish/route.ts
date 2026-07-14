import { z } from "zod";
import { publishFormRequestSchema } from "@/lib/form-definition";
import { publishForm } from "@/lib/forms-store";
import { InternalRouteError, internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ formId: string }> }) {
  try {
    const { data } = await readInternalJson(request, publishFormRequestSchema);
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) {
      throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    }

    requireInternalScope(data.actor, "forms:publish");
    const form = await publishForm(formId.data, data);
    return internalDataResponse(form);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
