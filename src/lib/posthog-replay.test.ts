import { describe, expect, it } from "vitest";
import { isSensitiveReplayPath } from "./posthog-replay";

describe("PostHog session replay privacy", () => {
  it.each(["/p", "/p/private-note"])("never records private-link route %s", (pathname) => {
    expect(isSensitiveReplayPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/about",
    "/billing",
    "/c/team-notes",
    "/connector",
    "/copy",
    "/feedback",
    "/mcp",
    "/oauth/authorize",
    "/online-clipboard",
    "/online-notepad",
    "/pages/page-id/edit",
    "/pricing",
    "/share-text",
    "/tools",
  ]) (
    "allows replay on product route %s",
    (pathname) => {
      expect(isSensitiveReplayPath(pathname)).toBe(false);
    },
  );

  it("does not treat a route with only a matching prefix as sensitive", () => {
    expect(isSensitiveReplayPath("/copies-of-artwork")).toBe(false);
  });
});
