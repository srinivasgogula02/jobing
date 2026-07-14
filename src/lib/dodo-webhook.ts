import { Webhook } from "standardwebhooks";

export type DodoWebhookHeaders = {
  "webhook-id": string;
  "webhook-signature": string;
  "webhook-timestamp": string;
};

export function dodoWebhookHeaders(headers: Headers): DodoWebhookHeaders | null {
  const value = {
    "webhook-id": headers.get("webhook-id") || "",
    "webhook-signature": headers.get("webhook-signature") || "",
    "webhook-timestamp": headers.get("webhook-timestamp") || "",
  };
  return Object.values(value).every(Boolean) ? value : null;
}

export function verifyDodoWebhook(body: string, headers: DodoWebhookHeaders, secret: string) {
  if (!secret.trim()) return false;
  try {
    new Webhook(secret).verify(body, headers);
    return true;
  } catch {
    return false;
  }
}
