import { z } from "zod";
import { formIntegrationRequestSchema } from "@/lib/integration-definition";
import {
  deleteFormIntegration,
  listFormIntegrationsForActor,
  saveFormIntegration,
  setFormIntegrationStatus,
} from "@/lib/forms-store";
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
  let operation = "integrations.request";
  try {
    const { formId: rawFormId } = await context.params;
    const formId = formIdSchema.safeParse(rawFormId);
    if (!formId.success) throw new InternalRouteError(400, "invalid_form_id", "The form ID is invalid.");
    const path = `/forms/api/internal/v1/forms/${formId.data}/integrations`;
    const { data } = await readInternalJson(request, formIntegrationRequestSchema, path);
    operation = `integrations.${data.action}`;

    if (data.action === "list") {
      requireInternalScope(data.actor, "forms:read");
      return internalDataResponse(await listFormIntegrationsForActor(data.actor.userId, formId.data));
    }

    requireInternalScope(data.actor, "forms:write");
    if (data.action === "save") {
      return internalDataResponse(await saveFormIntegration({
        actorId: data.actor.userId,
        formId: formId.data,
        provider: data.provider,
        config: data.config,
        secret: data.secret,
        replaceSecret: data.replaceSecret,
      }));
    }
    if (data.action === "status") {
      const changed = await setFormIntegrationStatus({
        actorId: data.actor.userId,
        formId: formId.data,
        provider: data.provider,
        status: data.status,
      });
      if (!changed) throw new InternalRouteError(404, "integration_not_found", "The integration was not found.");
      return internalDataResponse({ provider: data.provider, status: data.status });
    }

    const changed = await deleteFormIntegration({
      actorId: data.actor.userId,
      formId: formId.data,
      provider: data.provider,
    });
    if (!changed) throw new InternalRouteError(404, "integration_not_found", "The integration was not found.");
    return internalDataResponse({ provider: data.provider, deleted: true });
  } catch (error) {
    return internalErrorResponse(error, { operation });
  }
}
