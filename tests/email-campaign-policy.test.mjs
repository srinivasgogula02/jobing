import test from "node:test";
import assert from "node:assert/strict";
import {
  campaignBatchLimit,
  subscriberPredatesCampaign,
} from "../src/lib/email-campaign-policy.ts";

test("final batch cannot exceed the original target", () => {
  assert.equal(campaignBatchLimit(100, 100, 649, 600), 49);
});

test("a campaign with no remaining target sends nobody", () => {
  assert.equal(campaignBatchLimit(100, 100, 649, 649), 0);
});

test("daily budget remains a stricter cap", () => {
  assert.equal(campaignBatchLimit(100, 20, 649, 600), 20);
});

test("subscribers created after campaign creation are ineligible", () => {
  assert.equal(
    subscriberPredatesCampaign("2026-06-08T00:00:00Z", "2026-06-07T00:00:00Z"),
    false,
  );
});

test("subscribers created exactly at the cutoff remain eligible", () => {
  assert.equal(
    subscriberPredatesCampaign("2026-06-07T00:00:00Z", "2026-06-07T00:00:00Z"),
    true,
  );
});
