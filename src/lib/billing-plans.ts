export type BillingPlanKey = "pro" | "elite";

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  description: string;
  productId: string;
  price: number;
  currency: "USD";
  cadence: "month";
  credits: number;
  limits: {
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
    credits: 50,
    limits: {
      "forms.total": 25,
      "forms.published": 25,
      "submissions.accepted": 5_000,
    },
    features: [
      "Unlimited published web pages",
      "25 published custom forms",
      "5,000 form responses each month",
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
    credits: 150,
    limits: {
      "forms.total": 100,
      "forms.published": 100,
      "submissions.accepted": 25_000,
    },
    features: [
      "Everything in Starter",
      "100 published custom forms",
      "25,000 form responses each month",
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
