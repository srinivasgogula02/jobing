"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAuthCode, getClient } from "@/lib/oauth";

function target(base: string, values: Record<string, string | undefined>) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

export async function approveAuthorization(form: FormData) {
  const clientId = String(form.get("client_id") || "");
  const redirectUri = String(form.get("redirect_uri") || "");
  const state = form.get("state") ? String(form.get("state")) : undefined;
  const codeChallenge = String(form.get("code_challenge") || "");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const client = await getClient(clientId);
  if (!client || !client.redirect_uris.includes(redirectUri) || !codeChallenge) redirect("/oauth/authorize/error");
  const code = await createAuthCode({ clientId, userId, redirectUri, scope: "mcp", codeChallenge, codeChallengeMethod: "S256" });
  redirect(target(redirectUri, { code, state }));
}

export async function denyAuthorization(form: FormData) {
  const clientId = String(form.get("client_id") || "");
  const redirectUri = String(form.get("redirect_uri") || "");
  const state = form.get("state") ? String(form.get("state")) : undefined;
  const client = await getClient(clientId);
  if (!client || !client.redirect_uris.includes(redirectUri)) redirect("/oauth/authorize/error");
  redirect(target(redirectUri, { error: "access_denied", state }));
}
