"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  addPageDomain,
  PageDomainError,
  refreshPageDomain,
  removePageDomain,
  setPageCustomAddress,
} from "@/lib/page-domain-service";

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; code?: string };

async function currentUser() {
  const { userId } = await auth();
  if (!userId) throw new PageDomainError("domain_not_found", "Sign in to manage page domains.");
  return userId;
}

function failure(error: unknown): ActionResult {
  if (error instanceof PageDomainError) return { ok: false, error: error.message, code: error.code };
  console.error("[pages/domains] operation failed", error instanceof Error ? { name: error.name } : { type: typeof error });
  return { ok: false, error: "The request could not be completed right now." };
}

export async function addPageDomainAction(hostname: string): Promise<ActionResult<{ hostname: string }>> {
  try {
    const result = await addPageDomain(await currentUser(), hostname);
    revalidatePath("/dashboard/pages");
    return { ok: true, data: { hostname: result.hostname } };
  } catch (error) {
    return failure(error);
  }
}

export async function refreshPageDomainAction(domainId: string): Promise<ActionResult<{ ready: boolean }>> {
  try {
    const result = await refreshPageDomain(await currentUser(), domainId);
    revalidatePath("/dashboard/pages");
    return { ok: true, data: { ready: result.ready } };
  } catch (error) {
    return failure(error);
  }
}

export async function removePageDomainAction(domainId: string): Promise<ActionResult> {
  try {
    await removePageDomain(await currentUser(), domainId);
    revalidatePath("/dashboard/pages");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function setPageAddressAction(input: {
  pageId: string;
  domainId: string | null;
  path: string;
}): Promise<ActionResult<{ customUrl: string | null; ready: boolean }>> {
  try {
    const result = await setPageCustomAddress(await currentUser(), input.pageId, input.domainId, input.path);
    revalidatePath("/dashboard/pages");
    revalidatePath(`/pages/${encodeURIComponent(result.pageId)}/edit`);
    return { ok: true, data: { customUrl: result.customUrl, ready: result.ready } };
  } catch (error) {
    return failure(error);
  }
}
