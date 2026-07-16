"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardFormsActor, getDashboardForm } from "@/lib/dashboard-forms";
import { formDefinitionSchema } from "@/lib/form-definition";
import {
  createConnectorForm,
  duplicateConnectorForm,
  FormsServiceError,
  publishConnectorForm,
  setConnectorFormResponseState,
  updateConnectorForm,
} from "@/lib/forms-service";
import { captureProductEvent } from "@/lib/product-telemetry";
import { countBucket } from "@/lib/product-analytics-contract";

const FORMS_PATH = "/dashboard/forms";

const saveInputSchema = z.object({
  formId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).optional(),
  definition: formDefinitionSchema,
});

async function actor() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return dashboardFormsActor(userId);
}

function friendlyMessage(error: unknown) {
  if (!(error instanceof FormsServiceError)) return "The change could not be saved. Try again.";
  if (error.code === "stale_revision") return "This form changed in another tab. Refresh before saving again.";
  if (error.code === "form_limit_reached") return "Your workspace has reached its form limit.";
  if (error.code === "form_not_found") return "This form no longer exists or you cannot access it.";
  if (error.status === 503) return "Forms is temporarily unavailable. Your changes are still on this screen. Try again shortly.";
  return error.message;
}

export async function createFormAction() {
  const currentActor = await actor();
  const definition = formDefinitionSchema.parse({
    schemaVersion: 1,
    title: "Untitled form",
    description: "Tell people what this form is for.",
    fields: [{ id: randomUUID(), key: "name", type: "text", label: "Your name", required: true }],
  });
  let created;
  try {
    created = await createConnectorForm(currentActor, { name: "Untitled form", definition }, `dashboard:create:${randomUUID()}`);
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "create", outcome: "success", field_count_bucket: countBucket(definition.fields.length), resource_status: "draft" } });
  } catch (error) {
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "create", outcome: "error", error_code: error instanceof FormsServiceError ? error.code : "internal_error" } });
    if (error instanceof FormsServiceError && error.code === "form_limit_reached") {
      redirect("/pricing?reason=forms_limit");
    }
    throw error;
  }
  redirect(`${FORMS_PATH}/${created.id}/edit`);
}

export async function duplicateFormAction(formId: string) {
  const currentActor = await actor();
  let duplicate;
  try {
    const source = await getDashboardForm(currentActor.userId, formId);
    if (!source) redirect(FORMS_PATH);
    duplicate = await duplicateConnectorForm(
      currentActor,
      source.id,
      `${source.name} copy`.slice(0, 200),
      `dashboard:duplicate:${randomUUID()}`,
    );
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "duplicate", outcome: "success", resource_status: "draft" } });
  } catch (error) {
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "duplicate", outcome: "error", error_code: error instanceof FormsServiceError ? error.code : "internal_error" } });
    if (error instanceof FormsServiceError && error.code === "form_limit_reached") {
      redirect("/pricing?reason=forms_limit");
    }
    throw error;
  }
  revalidatePath(FORMS_PATH);
  redirect(`${FORMS_PATH}/${duplicate.id}/edit`);
}

export async function saveFormAction(input: unknown) {
  let currentActor;
  try {
    currentActor = await actor();
  } catch {
    return { ok: false as const, error: "Your session expired. Sign in again, then return to this form." };
  }
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the highlighted settings before saving." };
  try {
    const saved = await updateConnectorForm(currentActor, parsed.data.formId, {
      expectedRevision: parsed.data.expectedRevision,
      name: parsed.data.name,
      description: parsed.data.description,
      definition: parsed.data.definition,
    });
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "update", outcome: "success", field_count_bucket: countBucket(parsed.data.definition.fields.length), resource_status: saved.status } });
    revalidatePath(FORMS_PATH);
    revalidatePath(`${FORMS_PATH}/${parsed.data.formId}`);
    return { ok: true as const, revision: saved.revision, status: saved.status };
  } catch (error) {
    captureProductEvent({ event: "form_draft_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "update", outcome: "error", error_code: error instanceof FormsServiceError ? error.code : "internal_error" } });
    return { ok: false as const, error: friendlyMessage(error) };
  }
}

export async function publishFormAction(input: unknown) {
  let currentActor;
  try {
    currentActor = await actor();
  } catch {
    return { ok: false as const, error: "Your session expired. Sign in again before publishing." };
  }
  const parsed = z.object({ formId: z.string().uuid(), expectedRevision: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "The publish request is invalid." };
  try {
    const published = await publishConnectorForm(
      currentActor,
      parsed.data.formId,
      parsed.data.expectedRevision,
      `dashboard:publish:${randomUUID()}`,
    );
    captureProductEvent({ event: "form_publish_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "publish", outcome: "success", resource_status: "published" } });
    revalidatePath(FORMS_PATH);
    revalidatePath(`${FORMS_PATH}/${parsed.data.formId}`);
    return { ok: true as const, revision: published.revision, version: published.version, endpointId: published.endpointId };
  } catch (error) {
    captureProductEvent({ event: "form_publish_completed", distinctId: currentActor.userId, properties: { source: "dashboard", product_area: "forms", operation: "publish", outcome: "error", error_code: error instanceof FormsServiceError ? error.code : "internal_error" } });
    const message = friendlyMessage(error);
    return {
      ok: false as const,
      error: message,
      upgradeUrl: error instanceof FormsServiceError && error.code === "form_limit_reached"
        ? "/pricing?reason=forms_limit"
        : undefined,
    };
  }
}

export async function reviewSubmissionAction(input: unknown) {
  const currentActor = await actor();
  const parsed = z.object({ formId: z.string().uuid(), submissionId: z.string().uuid(), state: z.enum(["inbox", "spam", "archived"]) }).safeParse(input);
  if (!parsed.success) return;
  await setConnectorFormResponseState(currentActor, parsed.data.submissionId, parsed.data.state);
  revalidatePath(`${FORMS_PATH}/${parsed.data.formId}`);
}
