import { describe, expect, it } from "vitest";
import { campaignBatchLimit, subscriberPredatesCampaign } from "./email-campaign-policy";

describe("email campaign delivery policy", () => {
  it("uses the smallest of requested, daily, and remaining limits", () => {
    expect(campaignBatchLimit(100, 40, 1_000, 980)).toBe(20);
    expect(campaignBatchLimit(100, 40, 1_000, 100)).toBe(40);
  });

  it("never returns a negative batch size", () => {
    expect(campaignBatchLimit(100, 40, 10, 15)).toBe(0);
    expect(campaignBatchLimit(-1, 40, 10, 0)).toBe(0);
  });

  it("includes subscribers who existed when the campaign was created", () => {
    expect(subscriberPredatesCampaign("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")).toBe(true);
    expect(subscriberPredatesCampaign("2026-01-02T00:00:00Z", "2026-01-02T00:00:00Z")).toBe(true);
  });

  it("excludes subscribers added after campaign creation", () => {
    expect(subscriberPredatesCampaign("2026-01-03T00:00:00Z", "2026-01-02T00:00:00Z")).toBe(false);
  });
});
