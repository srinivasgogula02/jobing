import { FREE_FORMS_LIMITS, getBillingPlanByProductId } from "./billing-plans";

export type SubscriptionAccessState = "active" | "grace" | "inactive";

const EVENT_ORDER: Record<string, number> = {
  "subscription.active": 10,
  "subscription.plan_changed": 20,
  "subscription.renewed": 30,
  "subscription.on_hold": 40,
  "subscription.failed": 50,
  "subscription.cancelled": 60,
  "subscription.expired": 70,
};

export function subscriptionAccessState(eventType: string): SubscriptionAccessState | null {
  if (["subscription.active", "subscription.plan_changed", "subscription.renewed"].includes(eventType)) return "active";
  if (eventType === "subscription.on_hold") return "grace";
  if (["subscription.cancelled", "subscription.expired", "subscription.failed"].includes(eventType)) return "inactive";
  return null;
}

function sourceVersion(eventTimestamp: string, eventType: string) {
  const milliseconds = Date.parse(eventTimestamp);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error("Invalid subscription event timestamp");
  return milliseconds * 100 + (EVENT_ORDER[eventType] ?? 99);
}

export function buildFormsSubscriptionProjection(input: {
  userId: string;
  productId: string | null;
  accessState: SubscriptionAccessState;
  eventKey: string;
  eventTimestamp: string;
  eventType: string;
}) {
  if (!/^[A-Za-z0-9._-]{8,120}$/.test(input.eventKey)) throw new Error("Invalid subscription event key");
  const plan = input.productId ? getBillingPlanByProductId(input.productId) : null;
  if (input.accessState !== "inactive" && !plan) throw new Error("Unknown active subscription product");

  const version = sourceVersion(input.eventTimestamp, input.eventType);
  const isFree = input.accessState === "inactive";
  const limits = isFree ? FREE_FORMS_LIMITS : plan!.limits;
  const entitlementStatus: "active" | "grace" = input.accessState === "grace" ? "grace" : "active";

  return {
    operationId: `billing:${input.eventKey}`,
    workspace: {
      sourceWorkspaceId: input.userId,
      kind: "personal" as const,
      displayName: "Personal workspace",
      status: "active" as const,
      sourceVersion: version,
    },
    membership: {
      actorId: input.userId,
      role: "owner" as const,
      status: "active" as const,
      sourceVersion: version,
    },
    entitlement: {
      planKey: isFree ? "free" : plan!.key,
      status: entitlementStatus,
      sourceVersion: version,
      features: {
        pages: true,
        forms: true,
        connector: true,
      },
      limits: { ...limits },
    },
  };
}
