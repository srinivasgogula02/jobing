"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { revokeOAuthGrant } from "@/lib/oauth";

export async function revokeConnectorGrant(form: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to disconnect a client.");

  const grantId = String(form.get("grant_id") || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(grantId)) {
    throw new Error("Invalid connector grant.");
  }

  const revoked = await revokeOAuthGrant(userId, grantId);
  if (!revoked) throw new Error("This connection was not found or was already removed.");
  revalidatePath("/connector/manage");
}
