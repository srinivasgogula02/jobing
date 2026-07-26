import "server-only";

import { randomUUID } from "node:crypto";
import { deliverIntegration } from "@/lib/integration-delivery";
import {
  claimIntegrationDeliveries,
  completeIntegrationDelivery,
  listIntegrationSubmissionFiles,
} from "@/lib/forms-store";

const RETRY_DELAYS_MS = [30_000, 2 * 60_000, 10 * 60_000, 60 * 60_000, 6 * 60 * 60_000];

function retryAt(attempt: number, retryable: boolean) {
  if (!retryable || attempt > RETRY_DELAYS_MS.length) return undefined;
  const delay = RETRY_DELAYS_MS[Math.max(0, attempt - 1)];
  const jitter = Math.floor(Math.random() * Math.min(delay / 5, 30_000));
  return new Date(Date.now() + delay + jitter);
}

export async function runIntegrationDeliveries(input: {
  submissionId?: string;
  limit?: number;
}) {
  const lockToken = `delivery-${randomUUID()}`;
  const deliveries = await claimIntegrationDeliveries({
    lockToken,
    submissionId: input.submissionId,
    limit: input.limit ?? 10,
  });

  const results = await Promise.allSettled(deliveries.map(async (delivery) => {
    const files = delivery.provider === "google_drive"
      ? await listIntegrationSubmissionFiles(delivery.submission.id)
      : [];
    const outcome = await deliverIntegration(delivery, files);
    await completeIntegrationDelivery({
      lockToken,
      deliveryId: delivery.deliveryId,
      outcome,
      retryAt: retryAt(delivery.attempt, outcome.retryable),
    });
    return outcome;
  }));

  return {
    claimed: deliveries.length,
    succeeded: results.filter((entry) => entry.status === "fulfilled" && entry.value.success).length,
    failed: results.filter((entry) => entry.status === "rejected" || !entry.value.success).length,
  };
}

export async function runSubmissionIntegrations(submissionId: string) {
  const current = await runIntegrationDeliveries({ submissionId, limit: 25 });
  // Every accepted response also drains a small number of due retries. This
  // keeps retry latency low on the free Vercel plan without putting delivery
  // work on the respondent's critical path.
  const retries = await runIntegrationDeliveries({ limit: 5 });
  return {
    claimed: current.claimed + retries.claimed,
    succeeded: current.succeeded + retries.succeeded,
    failed: current.failed + retries.failed,
  };
}
