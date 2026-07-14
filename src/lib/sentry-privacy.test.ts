import { describe, expect, it } from "vitest";
import { scrubMainSentryEvent } from "./sentry-privacy";

describe("scrubMainSentryEvent", () => {
  it("removes request content and direct identifiers while keeping a stable ID", () => {
    const event = scrubMainSentryEvent({
      request: { url: "https://jobing.site/mcp?token=secret", method: "POST", data: "<main>private</main>", headers: { authorization: "Bearer secret" } },
      user: { id: "user_123", email: "person@example.com", username: "private" },
      extra: { prompt: "private" },
      breadcrumbs: [{ message: "private form answer" }],
    });
    expect(event.request).toEqual({ url: "/mcp", method: "POST" });
    expect(event.user).toEqual({ id: "user_123" });
    expect(event.extra).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
  });

  it("drops non-Jobing request URLs", () => {
    expect(scrubMainSentryEvent({ request: { url: "https://customer.example/private" } }).request).toBeUndefined();
  });
});
