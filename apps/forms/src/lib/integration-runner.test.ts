import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  files: vi.fn(),
  deliver: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/forms-store", () => ({
  claimIntegrationDeliveries: mocks.claim,
  completeIntegrationDelivery: mocks.complete,
  listIntegrationSubmissionFiles: mocks.files,
}));
vi.mock("@/lib/integration-delivery", () => ({
  deliverIntegration: mocks.deliver,
}));

import { runIntegrationDeliveries } from "@/lib/integration-runner";

const queuedDelivery = {
  deliveryId: "11111111-1111-4111-8111-111111111111",
  integrationId: "22222222-2222-4222-8222-222222222222",
  provider: "slack",
  config: { title: "New lead" },
  secretCiphertext: "encrypted",
  secretKeyId: "primary",
  attempt: 1,
  form: { id: "33333333-3333-4333-8333-333333333333", name: "Contact" },
  submission: {
    id: "44444444-4444-4444-8444-444444444444",
    receivedAt: "2026-07-26T12:00:00.000Z",
    values: { email: "person@example.com" },
    origin: null,
  },
};

describe("integration delivery runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claim.mockResolvedValue([queuedDelivery]);
    mocks.complete.mockResolvedValue(true);
    mocks.files.mockResolvedValue([]);
  });

  it("acknowledges successful delivery without scheduling another attempt", async () => {
    mocks.deliver.mockResolvedValue({ success: true, status: 200, code: null, retryable: false });

    const result = await runIntegrationDeliveries({ submissionId: queuedDelivery.submission.id });

    expect(result).toEqual({ claimed: 1, succeeded: 1, failed: 0 });
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      deliveryId: queuedDelivery.deliveryId,
      outcome: expect.objectContaining({ success: true }),
      retryAt: undefined,
    }));
  });

  it("uses a bounded retry for temporary provider failures", async () => {
    mocks.deliver.mockResolvedValue({ success: false, status: 429, code: "provider_http_429", retryable: true });

    const before = Date.now();
    const result = await runIntegrationDeliveries({});
    const completion = mocks.complete.mock.calls[0][0];

    expect(result).toEqual({ claimed: 1, succeeded: 0, failed: 1 });
    expect(completion.retryAt).toBeInstanceOf(Date);
    expect(completion.retryAt.getTime()).toBeGreaterThanOrEqual(before + 30_000);
    expect(completion.retryAt.getTime()).toBeLessThan(before + 37_000);
  });
});
