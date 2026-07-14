import { createFormDraftRequestSchema } from "@/lib/form-definition";
import { createFormDraft } from "@/lib/forms-store";
import { internalDataResponse, internalErrorResponse, readInternalJson, requireInternalScope } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data } = await readInternalJson(request, createFormDraftRequestSchema);
    requireInternalScope(data.actor, "forms:write");
    const form = await createFormDraft(data);
    return internalDataResponse(form, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
