"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardFormsActor } from "@/lib/dashboard-forms";
import { formIntegrationCatalog, integrationSettingsFromFormData } from "@/lib/form-integration-catalog";
import {
  deleteConnectorFormIntegration,
  formIntegrationProviderSchema,
  FormsServiceError,
  listConnectorFormIntegrations,
  saveConnectorFormIntegration,
  setConnectorFormIntegrationStatus,
} from "@/lib/forms-service";

const formIdSchema = z.string().uuid();

async function actor() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  return dashboardFormsActor(userId);
}

function destination(formId: string, query: Record<string, string>) {
  const search = new URLSearchParams(query);
  return `/dashboard/forms/${formId}/integrations?${search}`;
}

export async function saveFormIntegrationAction(formData: FormData) {
  const currentActor = await actor();
  const formId = formIdSchema.parse(String(formData.get("formId") ?? ""));
  try {
    const settings = integrationSettingsFromFormData(formData);
    const catalog = formIntegrationCatalog.find((entry) => entry.provider === settings.provider);
    if (catalog?.secretLabel && !settings.secret) {
      const current = await listConnectorFormIntegrations(currentActor, formId);
      if (!current.find((entry) => entry.provider === settings.provider)?.hasSecret) {
        redirect(destination(formId, { error: "credentials_required", open: settings.provider }));
      }
    }
    await saveConnectorFormIntegration({
      actor: currentActor,
      formId,
      ...settings,
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const provider = formIntegrationProviderSchema.safeParse(String(formData.get("provider") ?? ""));
    const errorCode = error instanceof FormsServiceError
      && ["invalid_integration_configuration", "integration_credentials_required"].includes(error.code)
      ? "invalid_configuration"
      : "save_failed";
    redirect(destination(formId, { error: errorCode, ...(provider.success ? { open: provider.data } : {}) }));
  }
  revalidatePath(`/dashboard/forms/${formId}/integrations`);
  redirect(destination(formId, { saved: formIntegrationProviderSchema.parse(String(formData.get("provider") ?? "")) }));
}

export async function setFormIntegrationStatusAction(formData: FormData) {
  const currentActor = await actor();
  const formId = formIdSchema.parse(String(formData.get("formId") ?? ""));
  const provider = formIntegrationProviderSchema.parse(String(formData.get("provider") ?? ""));
  const status = z.enum(["active", "paused"]).parse(String(formData.get("status") ?? ""));
  await setConnectorFormIntegrationStatus({ actor: currentActor, formId, provider, status });
  revalidatePath(`/dashboard/forms/${formId}/integrations`);
  redirect(destination(formId, { saved: provider }));
}

export async function deleteFormIntegrationAction(formData: FormData) {
  const currentActor = await actor();
  const formId = formIdSchema.parse(String(formData.get("formId") ?? ""));
  const provider = formIntegrationProviderSchema.parse(String(formData.get("provider") ?? ""));
  await deleteConnectorFormIntegration({ actor: currentActor, formId, provider });
  revalidatePath(`/dashboard/forms/${formId}/integrations`);
  redirect(destination(formId, { removed: provider }));
}
