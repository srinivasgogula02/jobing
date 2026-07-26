import { listFormsRequestSchema } from "@/lib/form-definition";
import { listFormsForActor, listFormSummariesForActor } from "@/lib/forms-store";
import { internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data } = await readInternalJson(
      request,
      listFormsRequestSchema,
      "/forms/api/internal/v1/forms/list",
    );
    requireInternalScope(data.actor, "forms:read");
    const forms = data.includeDefinition
      ? await listFormsForActor(data.actor.userId)
      : await listFormSummariesForActor(data.actor.userId);
    return internalDataResponse({ forms });
  } catch (error) {
    return internalErrorResponse(error, { operation: "forms.list" });
  }
}
