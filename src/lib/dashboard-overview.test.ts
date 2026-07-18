import { describe, expect, it } from "vitest";
import { resolveDashboardNextStep, usagePercentage } from "@/lib/dashboard-overview";

const page = { id: "launch", updated_at: "2026-07-18T10:00:00.000Z" };
const draft = { id: "draft-id", status: "draft" as const, updatedAt: "2026-07-18T11:00:00.000Z" };
const published = { id: "live-id", status: "published" as const, updatedAt: "2026-07-18T12:00:00.000Z" };

describe("dashboard overview", () => {
  it("prioritizes connecting before asking the user to create work", () => {
    expect(resolveDashboardNextStep({ connectionCount: 0, pages: [page], forms: [published] }).kind).toBe("connect");
  });

  it("prioritizes an unfinished form after connection", () => {
    expect(resolveDashboardNextStep({ connectionCount: 1, pages: [page], forms: [published, draft] })).toMatchObject({
      kind: "finish_form",
      href: "/dashboard/forms/draft-id/edit",
    });
  });

  it("routes a working workspace to the response inbox", () => {
    expect(resolveDashboardNextStep({ connectionCount: 1, pages: [page], forms: [published] })).toMatchObject({
      kind: "review_responses",
      href: "/dashboard/forms/live-id",
    });
  });

  it("clamps plan usage for display", () => {
    expect(usagePercentage(3, 5)).toBe(60);
    expect(usagePercentage(7, 5)).toBe(100);
    expect(usagePercentage(1, 0)).toBe(0);
  });
});
