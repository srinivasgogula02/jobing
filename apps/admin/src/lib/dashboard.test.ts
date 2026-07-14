import { describe, expect, it } from "vitest";
import { sentryIssuesUrl, type ProviderResult } from "./dashboard";

describe("dashboard provider result", () => {
  it("keeps unavailable distinct from a real zero", () => {
    const unavailable: ProviderResult<number[]> = { status: "unavailable", reason: "timeout" };
    const empty: ProviderResult<number[]> = { status: "ok", data: [] };
    expect(unavailable.status).not.toBe(empty.status);
  });

  it("uses Sentry's supported 14 day project issue window", () => {
    expect(sentryIssuesUrl("https://sentry.io/", "jobing ai", "javascript/nextjs")).toBe(
      "https://sentry.io/api/0/projects/jobing%20ai/javascript%2Fnextjs/issues/?query=is%3Aunresolved&statsPeriod=14d&limit=20",
    );
  });
});
