import "server-only";

import { formDefinitionSchema } from "@/lib/form-definition";
import {
  listDashboardFormsFromService,
  type FormsActor,
} from "@/lib/forms-service";
import type { EditableForm } from "@/lib/forms-store";

const DASHBOARD_GRANT_ID = "6fe3edba-a9d5-4c42-a410-0fa50f366f46";

export function dashboardFormsActor(userId: string): FormsActor {
  return {
    userId,
    clientId: "jobing-dashboard",
    grantId: DASHBOARD_GRANT_ID,
    scopes: [
      "forms:read",
      "forms:write",
      "forms:publish",
      "forms.responses:read",
      "forms.responses:write",
    ],
  };
}

export async function listDashboardForms(userId: string): Promise<EditableForm[]> {
  const forms = await listDashboardFormsFromService(dashboardFormsActor(userId));
  return forms.map((form) => ({
    id: form.id,
    name: form.name,
    status: form.status,
    revision: form.revision,
    publishedVersion: form.publishedVersion,
    endpointId: form.endpointId,
    definition: formDefinitionSchema.parse(form.definition),
    updatedAt: form.updatedAt,
  }));
}

export async function getDashboardForm(userId: string, formId: string) {
  return (await listDashboardForms(userId)).find((form) => form.id === formId) ?? null;
}
