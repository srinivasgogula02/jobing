"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  createAuthCode,
  getClient,
  getMcpResourceUrl,
  isValidPkceS256Challenge,
} from "@/lib/oauth";
import {
  InvalidOAuthScopeError,
  normalizeRequestedScopes,
  serializeOAuthScopes,
} from "@/lib/oauth-scopes";
import { captureProductEvent } from "@/lib/product-telemetry";
import { classifyConnectorClient } from "@/lib/product-analytics-contract";

function target(base: string, values: Record<string, string | undefined>) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

function value(form: FormData, key: string, maxLength: number): string {
  const input = String(form.get(key) || "");
  return input.length <= maxLength ? input : "";
}

export async function approveAuthorization(form: FormData) {
  const clientId = value(form, "client_id", 256);
  const redirectUri = value(form, "redirect_uri", 2048);
  const state = value(form, "state", 2048) || undefined;
  const codeChallenge = value(form, "code_challenge", 128);
  const codeChallengeMethod = value(form, "code_challenge_method", 16);
  const requestedResource = value(form, "resource", 2048);
  const requestedScope = value(form, "scope", 1024);
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await getClient(clientId);
  if (
    !client
    || !client.redirect_uris.includes(redirectUri)
    || !requestedScope
    || codeChallengeMethod !== "S256"
    || !isValidPkceS256Challenge(codeChallenge)
  ) {
    redirect("/oauth/authorize/error");
  }

  const resource = requestedResource || getMcpResourceUrl();
  if (resource !== getMcpResourceUrl()) redirect("/oauth/authorize/error");

  let scope: string;
  try {
    scope = serializeOAuthScopes(normalizeRequestedScopes(requestedScope));
  } catch (error) {
    if (error instanceof InvalidOAuthScopeError) {
      redirect(target(redirectUri, { error: "invalid_scope", error_description: error.message, state }));
    }
    throw error;
  }

  const code = await createAuthCode({
    clientId,
    userId,
    redirectUri,
    scope,
    resource,
    codeChallenge,
    codeChallengeMethod: "S256",
  });
  captureProductEvent({
    event: "connector_oauth_completed",
    distinctId: userId,
    properties: { outcome: "approved", client_type: classifyConnectorClient([redirectUri]), scope_count: scope.split(" ").length, product_area: "connector" },
  });
  redirect(target(redirectUri, { code, state }));
}

export async function denyAuthorization(form: FormData) {
  const clientId = value(form, "client_id", 256);
  const redirectUri = value(form, "redirect_uri", 2048);
  const state = value(form, "state", 2048) || undefined;
  const client = await getClient(clientId);
  if (!client || !client.redirect_uris.includes(redirectUri)) redirect("/oauth/authorize/error");
  captureProductEvent({ event: "connector_oauth_completed", properties: { outcome: "denied", client_type: classifyConnectorClient([redirectUri]), product_area: "connector" } });
  redirect(target(redirectUri, { error: "access_denied", state }));
}
