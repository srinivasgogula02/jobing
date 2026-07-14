import { listFormsRequestSchema } from "@/lib/form-definition";
import { listFormsForActor } from "@/lib/forms-store";
import { internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data } = await readInternalJson(request, listFormsRequestSchema);
    requireInternalScope(data.actor, "forms:read");
    const forms = await listFormsForActor(data.actor.userId);
    return internalDataResponse({ forms });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
