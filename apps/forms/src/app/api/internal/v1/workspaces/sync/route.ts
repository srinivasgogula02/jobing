import { workspaceProjectionRequestSchema } from "@/lib/form-definition";
import { applyWorkspaceProjection } from "@/lib/forms-store";
import { internalDataResponse, internalErrorResponse, readInternalJson } from "@/lib/internal-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data, rawBody } = await readInternalJson(request, workspaceProjectionRequestSchema);
    const projection = await applyWorkspaceProjection(data, rawBody);
    return internalDataResponse(projection);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
