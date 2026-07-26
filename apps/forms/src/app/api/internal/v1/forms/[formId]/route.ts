import { z } from "zod";
import { getFormRequestSchema } from "@/lib/form-definition";
import { getFormForActor } from "@/lib/forms-store";
import {
  InternalRouteError,
  internalDataResponse,
  internalErrorResponse,
  readInternalJson,
  requireInternalScope,
} from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formIdSchema = z.string().uuid();

export async function POST(request: Request, context: { params: Promise<{ formId: string }> }) {
  try {
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    const path = `/forms/api/internal/v1/forms/${formId.data}`;
    const { data } = await readInternalJson(request, getFormRequestSchema, path);
    requireInternalScope(data.actor, "forms:read");
    const form = await getFormForActor(data.actor.userId, formId.data);
    if (!form) throw new InternalRouteError(404, "form_not_found", "The requested form was not found.");
    return internalDataResponse(form);
  } catch (error) {
    return internalErrorResponse(error, { operation: "forms.get" });
  }
}
