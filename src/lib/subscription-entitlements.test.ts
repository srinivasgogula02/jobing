import { afterEach, describe, expect, it } from "vitest";
import { buildFormsSubscriptionProjection, subscriptionAccessState } from "./subscription-entitlements";

const originalPro = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO;
const originalElite = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE;

afterEach(() => {
  process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO = originalPro;
  process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE = originalElite;
});

describe("subscription entitlement projection", () => {
  it("classifies payment grace separately from cancellation", () => {
    expect(subscriptionAccessState("subscription.active")).toBe("active");
    expect(subscriptionAccessState("subscription.renewed")).toBe("active");
    expect(subscriptionAccessState("subscription.on_hold")).toBe("grace");
    expect(subscriptionAccessState("subscription.cancelled")).toBe("inactive");
    expect(subscriptionAccessState("payment.succeeded")).toBe(null);
  });

  it("projects paid limits and a stable operation identity", () => {
    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO = "pdt_pro";
    const first = buildFormsSubscriptionProjection({
      userId: "user_123",
      productId: "pdt_pro",
      accessState: "active",
      eventKey: "abc123def456",
      eventTimestamp: "2026-07-15T00:00:00.000Z",
      eventType: "subscription.active",
    });
    const retry = buildFormsSubscriptionProjection({
      userId: "user_123",
      productId: "pdt_pro",
      accessState: "active",
      eventKey: "abc123def456",
      eventTimestamp: "2026-07-15T00:00:00.000Z",
      eventType: "subscription.active",
    });
    expect(first).toEqual(retry);
    expect(first.entitlement).toMatchObject({
      planKey: "pro",
      status: "active",
      limits: { "forms.published": 25, "submissions.accepted": 5000 },
    });
  });

  it("returns cancelled users to the five-form standard entitlement", () => {
    const projection = buildFormsSubscriptionProjection({
      userId: "user_123",
      productId: null,
      accessState: "inactive",
      eventKey: "cancel123456",
      eventTimestamp: "2026-07-15T00:00:01.000Z",
      eventType: "subscription.cancelled",
    });
    expect(projection.entitlement).toMatchObject({
      planKey: "free",
      status: "active",
      limits: { "forms.total": 5, "forms.published": 5, "submissions.accepted": 50 },
    });
  });
});
