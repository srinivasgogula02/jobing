import { describe, expect, it } from "vitest";
import { Webhook } from "standardwebhooks";
import { dodoWebhookHeaders, verifyDodoWebhook } from "./dodo-webhook";

describe("Dodo webhook boundary", () => {
  const secret = "whsec_dGVzdC13ZWJob29rLXNlY3JldA==";
  const body = JSON.stringify({ type: "subscription.active", data: { subscription_id: "sub_test" } });
  const id = "msg_01HZZZZZZZZZZZZZZZZZZZZZZZ";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, body);

  it("accepts the exact body signed by the configured endpoint secret", () => {
    expect(verifyDodoWebhook(body, {
      "webhook-id": id,
      "webhook-signature": signature,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    }, secret)).toBe(true);
  });

  it("rejects an empty or mismatched deployment secret", () => {
    const headers = {
      "webhook-id": id,
      "webhook-signature": signature,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    };
    expect(verifyDodoWebhook(body, headers, "")).toBe(false);
    expect(verifyDodoWebhook(body, headers, "whsec_d3Jvbmc=" )).toBe(false);
  });

  it("rejects requests missing any standard webhook header", () => {
    expect(dodoWebhookHeaders(new Headers({ "webhook-id": id }))).toBeNull();
  });
});
