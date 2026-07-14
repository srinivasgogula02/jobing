import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  sync: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/forms-service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/forms-service")>();
  return { ...original, syncFormsWorkspaceProjection: mocks.sync };
});

import {
  drainFormsProjectionOutbox,
  enqueueAndDeliverUserDeletion,
} from "./forms-projection-outbox";

const payload = {
  operationId: "clerk-delete:evt_test_1234",
  workspace: {
    sourceWorkspaceId: "user_123",
    kind: "personal" as const,
    displayName: "Deleted workspace",
    status: "deleted" as const,
    sourceVersion: 1_783_984_000_000,
  },
  membership: {
    actorId: "user_123",
    role: "owner" as const,
    status: "removed" as const,
    sourceVersion: 1_783_984_000_000,
  },
  entitlement: {
    planKey: "free",
    status: "cancelled" as const,
    sourceVersion: 1_783_984_000_000,
    features: {},
    limits: {},
  },
};

beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.sync.mockReset();
  mocks.sync.mockResolvedValue({ workspaceId: "f3048401-b09e-49fd-9dff-51ec6f5df117", applied: true });
});

describe("Forms workspace projection outbox", () => {
  it("atomically enqueues a deletion, delivers it, and acknowledges the event", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: payload, error: null })
      .mockResolvedValueOnce({ data: true, error: null });

    await enqueueAndDeliverUserDeletion({
      userId: "user_123",
      eventKey: "evt_test_1234",
      sourceVersion: payload.workspace.sourceVersion,
    });

    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "jobing_delete_user_and_enqueue_forms", {
      p_user_id: "user_123",
      p_event_key: "evt_test_1234",
      p_source_version: payload.workspace.sourceVersion,
    });
    expect(mocks.sync).toHaveBeenCalledWith(payload);
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "forms_ack_workspace_projection_event", {
      p_event_key: "evt_test_1234",
    });
  });

  it("claims and acknowledges durable retry work", async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: [{
          id: "d415cfb9-f55f-4e9d-99f0-11c0a796282b",
          eventKey: "evt_test_1234",
          leaseToken: "e7ae107f-77d2-4af8-b355-6dbf46eb16ef",
          payload,
          attempts: 1,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    await expect(drainFormsProjectionOutbox(10)).resolves.toEqual({ claimed: 1, delivered: 1, failed: 0 });
    expect(mocks.rpc).toHaveBeenLastCalledWith("forms_ack_workspace_projection", {
      p_id: "d415cfb9-f55f-4e9d-99f0-11c0a796282b",
      p_lease_token: "e7ae107f-77d2-4af8-b355-6dbf46eb16ef",
    });
  });

  it("nacks failed delivery without persisting sensitive error text", async () => {
    mocks.sync.mockRejectedValueOnce(new Error("password=secret"));
    mocks.rpc
      .mockResolvedValueOnce({
        data: [{
          id: "d415cfb9-f55f-4e9d-99f0-11c0a796282b",
          eventKey: "evt_test_1234",
          leaseToken: "e7ae107f-77d2-4af8-b355-6dbf46eb16ef",
          payload,
          attempts: 2,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    await expect(drainFormsProjectionOutbox()).resolves.toEqual({ claimed: 1, delivered: 0, failed: 1 });
    expect(mocks.rpc).toHaveBeenLastCalledWith("forms_nack_workspace_projection", expect.objectContaining({
      p_error_code: "delivery_failed",
    }));
  });
});
