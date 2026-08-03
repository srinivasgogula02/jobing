export type BillingPlanKey = "pro" | "elite";

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  description: string;
  productId: string;
  price: number;
  currency: "USD";
  cadence: "month";
  limits: {
    "pages.total": number;
    "pages.custom_domains": number;
    "forms.total": number;
    "forms.published": number;
    "submissions.accepted": number;
  };
  features: readonly string[];
  highlighted: boolean;
};

const PLAN_DEFINITIONS = [
  {
    key: "pro" as const,
    name: "Starter",
    description: "For launching pages, forms, and lead collection without stitching tools together.",
    price: 9,
    currency: "USD" as const,
    cadence: "month" as const,
    limits: {
      "pages.total": 25,
      "pages.custom_domains": 1,
      "forms.total": 25,
      "forms.published": 25,
      "submissions.accepted": 5_000,
    },
    features: [
      "25 published web pages",
      "1 custom domain",
      "25 published custom forms",
      "View 5,000 form responses each month",
      "Extra responses stay saved until you upgrade",
      "Create and edit from your AI app",
      "One dashboard for every response",
      "Standard support",
    ],
    highlighted: true,
  },
  {
    key: "elite" as const,
    name: "Business",
    description: "For agencies and teams running several campaigns, clients, or hiring flows.",
    price: 29,
    currency: "USD" as const,
    cadence: "month" as const,
    limits: {
      "pages.total": 100,
      "pages.custom_domains": 5,
      "forms.total": 100,
      "forms.published": 100,
      "submissions.accepted": 25_000,
    },
    features: [
      "Everything in Starter",
      "100 published web pages",
      "5 custom domains",
      "100 published custom forms",
      "View 25,000 form responses each month",
      "Extra responses stay saved until you upgrade",
      "Create and edit from your AI app",
      "One dashboard for every response",
      "Priority support",
    ],
    highlighted: false,
  },
] as const;

function configuredProductId(key: BillingPlanKey) {
  return key === "pro"
    ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || ""
    : process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE || "";
}

export function getBillingPlans(): BillingPlan[] {
  return PLAN_DEFINITIONS.map((plan) => ({
    ...plan,
    features: [...plan.features],
    productId: configuredProductId(plan.key),
  }));
}

export function getBillingPlanByProductId(productId: string) {
  if (!productId) return null;
  return getBillingPlans().find((plan) => plan.productId === productId) ?? null;
}

export function isAllowedBillingProduct(productId: string) {
  return getBillingPlanByProductId(productId) !== null;
}

export const FREE_FORMS_LIMITS = {
  "forms.total": 5,
  "forms.published": 5,
  "submissions.accepted": 50,
} as const;

export const FREE_PAGE_LIMITS = {
  "pages.total": 5,
  "pages.custom_domains": 0,
} as const;
