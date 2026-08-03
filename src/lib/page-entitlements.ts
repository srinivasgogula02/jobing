import "server-only";

import { getBillingPlanByProductId, FREE_PAGE_LIMITS, type BillingPlanKey } from "@/lib/billing-plans";
import { getUserSubscriptionForUser } from "@/lib/billing-data";

const PAID_ACCESS_STATUSES = new Set(["active", "pending", "on_hold"]);

export type PageEntitlement = {
  planKey: "free" | BillingPlanKey;
  planName: string;
  pageLimit: number;
  customDomainLimit: number;
};

export async function getPageEntitlement(userId: string): Promise<PageEntitlement> {
  const subscription = await getUserSubscriptionForUser(userId);
  const plan = subscription?.product_id && PAID_ACCESS_STATUSES.has(subscription.status)
    ? getBillingPlanByProductId(subscription.product_id)
    : null;

  if (!plan) {
    return {
      planKey: "free",
      planName: "Free",
      pageLimit: FREE_PAGE_LIMITS["pages.total"],
      customDomainLimit: FREE_PAGE_LIMITS["pages.custom_domains"],
    };
  }

  return {
    planKey: plan.key,
    planName: plan.name,
    pageLimit: plan.limits["pages.total"],
    customDomainLimit: plan.limits["pages.custom_domains"],
  };
}
