import { afterEach, describe, expect, it } from "vitest";
import {
  getBillingPlanByProductId,
  getBillingPlans,
  isAllowedBillingProduct,
} from "./billing-plans";

const originalPro = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO;
const originalElite = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE;

afterEach(() => {
  process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO = originalPro;
  process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE = originalElite;
});

describe("billing plan catalog", () => {
  it("maps only configured products to public plans", () => {
    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO = "pdt_pro";
    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE = "pdt_elite";

    expect(isAllowedBillingProduct("pdt_pro")).toBe(true);
    expect(isAllowedBillingProduct("pdt_elite")).toBe(true);
    expect(isAllowedBillingProduct("pdt_attacker_controlled")).toBe(false);
  });

  it("returns paid Forms entitlements for each product", () => {
    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO = "pdt_pro";
    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE = "pdt_elite";

    expect(getBillingPlanByProductId("pdt_pro")).toMatchObject({
      key: "pro",
      name: "Starter",
      price: 9,
      limits: { "forms.total": 25, "forms.published": 25, "submissions.accepted": 5000 },
    });
    expect(getBillingPlanByProductId("pdt_elite")).toMatchObject({
      key: "elite",
      name: "Business",
      price: 29,
      limits: { "forms.total": 100, "forms.published": 100, "submissions.accepted": 25000 },
    });
  });

  it("does not expose checkout buttons when product IDs are missing", () => {
    delete process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO;
    delete process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE;
    expect(getBillingPlans().every((plan) => plan.productId === "")).toBe(true);
  });
});
