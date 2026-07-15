import { describe, expect, it } from "vitest";
import { filterMainClientSentryEvent, scrubMainSentryEvent } from "./sentry-privacy";

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

  it("drops Android navigation logger errors raised after its native bridge is destroyed", () => {
    expect(filterMainClientSentryEvent({
      exception: {
        values: [{
          type: "Error",
          value: "Error invoking postMessage: Java object is gone",
          stacktrace: {
            frames: [
              { filename: "app://navigation_performance_logger_android", function: "sendDataToNative" },
              { filename: "https://jobing.site/_next/static/chunks/sentry.js", function: "n" },
            ],
          },
        }],
      },
    })).toBeNull();
  });

  it("keeps same-message application errors without the injected Android logger frame", () => {
    const event = filterMainClientSentryEvent({
      request: { url: "https://jobing.site/connector?token=secret" },
      exception: {
        values: [{
          type: "Error",
          value: "Error invoking postMessage: Java object is gone",
          stacktrace: { frames: [{ filename: "https://jobing.site/_next/static/chunks/app.js" }] },
        }],
      },
    });

    expect(event).not.toBeNull();
    expect(event?.request).toEqual({ url: "/connector", method: undefined });
  });

  it("keeps other errors from the injected Android logger", () => {
    expect(filterMainClientSentryEvent({
      exception: {
        values: [{
          type: "TypeError",
          value: "Unexpected logger failure",
          stacktrace: { frames: [{ abs_path: "app://navigation_performance_logger_android" }] },
        }],
      },
    })).not.toBeNull();
  });

  it("drops iOS page-hide logger errors when its WebKit bridge is unavailable", () => {
    expect(filterMainClientSentryEvent({
      exception: {
        values: [{
          type: "TypeError",
          value: "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
          stacktrace: {
            frames: [
              { filename: "app:///", function: "sendDataToNative" },
              { filename: "app:///", function: "sendPageHideMessage" },
            ],
          },
        }],
      },
    })).toBeNull();
  });

  it("keeps same-message app errors without the injected iOS bridge function", () => {
    expect(filterMainClientSentryEvent({
      exception: {
        values: [{
          type: "TypeError",
          value: "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
          stacktrace: { frames: [{ filename: "app:///", function: "renderApplication" }] },
        }],
      },
    })).not.toBeNull();
  });

  it("keeps other errors from the injected iOS bridge function", () => {
    expect(filterMainClientSentryEvent({
      exception: {
        values: [{
          type: "TypeError",
          value: "Unexpected native integration failure",
          stacktrace: { frames: [{ filename: "app:///", function: "sendDataToNative" }] },
        }],
      },
    })).not.toBeNull();
  });
});
