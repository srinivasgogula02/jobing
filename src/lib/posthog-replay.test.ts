import { describe, expect, it } from "vitest";
import { isSensitiveReplayPath } from "./posthog-replay";

describe("PostHog session replay privacy", () => {
  it.each([
    "/billing",
    "/c/team-notes",
    "/copy",
    "/feedback",
    "/mcp",
    "/oauth/authorize",
    "/online-clipboard",
    "/online-notepad",
    "/p/private-note",
    "/pages/page-id/edit",
    "/share-text",
  ])("never records sensitive route %s", (pathname) => {
    expect(isSensitiveReplayPath(pathname)).toBe(true);
  });

  it.each(["/", "/about", "/connector", "/pricing", "/tools"]) (
    "allows replay on non-sensitive route %s",
    (pathname) => {
      expect(isSensitiveReplayPath(pathname)).toBe(false);
    },
  );

  it("does not treat a route with only a matching prefix as sensitive", () => {
    expect(isSensitiveReplayPath("/copies-of-artwork")).toBe(false);
  });
});
