"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formDefinitionSchema } from "@/lib/form-definition";
import {
  createDashboardForm,
  duplicateDashboardForm,
  publishDashboardForm,
  setSubmissionReviewState,
  updateDashboardForm,
} from "@/lib/forms-store";

const saveInputSchema = z.object({
  formId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).optional(),
  definition: formDefinitionSchema,
});

function messageFor(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("STALE_REVISION")) return "This form changed in another tab. Refresh before saving again.";
  if (message.includes("LIMIT") || message.includes("HARD_LIMIT")) return "Your workspace has reached its form limit.";
  if (message.includes("FORBIDDEN")) return "You do not have permission to change this form.";
  return "The change could not be saved. Try again.";
}

async function actor() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}

export async function createFormAction() {
  const userId = await actor();
  const definition = formDefinitionSchema.parse({
    schemaVersion: 1,
    title: "Untitled form",
    description: "Tell people what this form is for.",
    fields: [{ id: randomUUID(), key: "name", type: "text", label: "Your name", required: true }],
  });
  let created;
  try {
    created = await createDashboardForm(userId, "Untitled form", definition);
  } catch {
    redirect(`${process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site"}/pricing?reason=forms_limit`);
  }
  redirect(`/app/forms/${created.id}/edit`);
}

export async function duplicateFormAction(formId: string) {
  const userId = await actor();
  let duplicate;
  try {
    duplicate = await duplicateDashboardForm(userId, formId);
  } catch {
    redirect(`${process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site"}/pricing?reason=forms_limit`);
  }
  revalidatePath("/app");
  redirect(`/app/forms/${duplicate.id}/edit`);
}

export async function saveFormAction(input: unknown) {
  const userId = await actor();
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the highlighted settings before saving." };
  try {
    const saved = await updateDashboardForm({ actorId: userId, ...parsed.data });
    revalidatePath("/app");
    revalidatePath(`/app/forms/${parsed.data.formId}`);
    return { ok: true as const, revision: saved.revision, status: saved.status };
  } catch (error) {
    return { ok: false as const, error: messageFor(error) };
  }
}

export async function publishFormAction(input: unknown) {
  const userId = await actor();
  const parsed = z.object({ formId: z.string().uuid(), expectedRevision: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "The publish request is invalid." };
  try {
    const published = await publishDashboardForm(userId, parsed.data.formId, parsed.data.expectedRevision);
    revalidatePath("/app");
    revalidatePath(`/app/forms/${parsed.data.formId}`);
    return { ok: true as const, revision: published.revision, version: published.version, endpointId: published.endpointId };
  } catch (error) {
    const message = messageFor(error);
    return {
      ok: false as const,
      error: message,
      upgradeUrl: message.includes("limit") ? `${process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site"}/pricing?reason=forms_limit` : undefined,
    };
  }
}

export async function reviewSubmissionAction(input: unknown) {
  const userId = await actor();
  const parsed = z.object({ formId: z.string().uuid(), submissionId: z.string().uuid(), state: z.enum(["inbox", "spam", "archived"]) }).safeParse(input);
  if (!parsed.success) return;
  await setSubmissionReviewState(userId, parsed.data.submissionId, parsed.data.state);
  revalidatePath(`/app/forms/${parsed.data.formId}`);
}
