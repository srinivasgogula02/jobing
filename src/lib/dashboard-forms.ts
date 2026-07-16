import "server-only";

import { formDefinitionSchema } from "@/lib/form-definition";
import {
  FormsServiceError,
  getFormFromService,
  listDashboardFormsFromService,
  type FormsActor,
} from "@/lib/forms-service";

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

export type DashboardFormSummary = {
  id: string;
  name: string;
  status: "draft" | "published" | "paused" | "archived" | "trashed";
  revision: number;
  publishedVersion: number;
  endpointId: string;
  description?: string;
  fieldCount: number;
  updatedAt: string;
};

export async function listDashboardForms(userId: string): Promise<DashboardFormSummary[]> {
  const forms = await listDashboardFormsFromService(dashboardFormsActor(userId));
  return forms.map((form) => ({
    id: form.id,
    name: form.name,
    status: form.status,
    revision: form.revision,
    publishedVersion: form.publishedVersion,
    endpointId: form.endpointId,
    description: form.description,
    fieldCount: form.fieldCount ?? 0,
    updatedAt: form.updatedAt,
  }));
}

export async function getDashboardForm(userId: string, formId: string) {
  const form = await getFormFromService(dashboardFormsActor(userId), formId).catch((error) => {
    if (error instanceof FormsServiceError && error.code === "form_not_found") return null;
    throw error;
  });
  if (!form) return null;
  return {
    id: form.id,
    name: form.name,
    status: form.status,
    revision: form.revision,
    publishedVersion: form.publishedVersion,
    endpointId: form.endpointId,
    definition: formDefinitionSchema.parse(form.definition),
    updatedAt: form.updatedAt,
  };
}
