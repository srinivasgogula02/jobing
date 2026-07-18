import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./internal-auth";

const db = vi.hoisted(() => ({
  databaseConfigured: vi.fn(),
  query: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => db);

import { acceptSubmission, createFormDraft, publishForm } from "./forms-store";

const firstGrantId = "33333333-3333-4333-8333-333333333333";
const secondGrantId = "44444444-4444-4444-8444-444444444444";

function createDraftRequest(grantId = firstGrantId) {
  return {
    operationId: "operation-create-123",
    actor: {
      userId: "user_123",
      clientId: "client_123",
      grantId,
      scopes: ["forms:write" as const],
    },
    form: {
      name: "Contact",
      definition: {
        schemaVersion: 1 as const,
        title: "Contact",
        fields: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            key: "email",
            type: "email" as const,
            label: "Email",
            required: true,
          },
        ],
        confirmation: { message: "Thanks" },
      },
    },
  };
}

beforeEach(() => {
  db.query.mockReset().mockResolvedValue({
    rows: [{ value: { id: "11111111-1111-4111-8111-111111111111", name: "Contact", status: "draft", revision: 1, endpointId: "frm_test" } }],
  });
});

describe("forms store request idempotency", () => {
  it("uses race-safe form behavior enforcement and falls back during rolling migrations", async () => {
    db.query
      .mockRejectedValueOnce(Object.assign(new Error("missing function"), { code: "42883" }))
      .mockResolvedValueOnce({ rows: [{ value: { submissionId: "11111111-1111-4111-8111-111111111111", message: "Thanks", redirectUrl: null, fileCount: 0 } }] });
    await expect(acceptSubmission({ endpointId: "frm_test", idempotencyKey: "submission-test", values: { email: "a@example.com" }, origin: null, ipHash: "a".repeat(64) })).resolves.toMatchObject({ message: "Thanks" });
    expect(db.query.mock.calls[0]?.[0]).toContain("accept_submission_v3");
    expect(db.query.mock.calls[1]?.[0]).toContain("accept_submission_v2");
  });

  it("persists a fixed-length SHA-256 request hash", async () => {
    const rawBody = JSON.stringify({ operationId: "operation-create-123", name: "Contact" });
    await createFormDraft(createDraftRequest());

    const values = db.query.mock.calls[0]?.[1] as unknown[];
    expect(values[2]).toBe(firstGrantId);
    expect(values[4]).not.toBe(sha256Hex(rawBody));
    expect(values[4]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not share create idempotency inputs across grants", async () => {
    await createFormDraft(createDraftRequest(firstGrantId));
    await createFormDraft(createDraftRequest(secondGrantId));

    const firstValues = db.query.mock.calls[0]?.[1] as unknown[];
    const secondValues = db.query.mock.calls[1]?.[1] as unknown[];

    expect(firstValues[2]).toBe(firstGrantId);
    expect(secondValues[2]).toBe(secondGrantId);
    expect(firstValues[3]).toBe(secondValues[3]);
    expect(firstValues[4]).not.toBe(secondValues[4]);
  });

  it("does not share publish idempotency inputs across grants", async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          value: {
            id: "11111111-1111-4111-8111-111111111111",
            status: "published",
            revision: 1,
            version: 1,
            endpointId: "frm_test",
          },
        },
      ],
    });
    const request = {
      operationId: "operation-publish-123",
      actor: {
        userId: "user_123",
        clientId: "client_123",
        grantId: firstGrantId,
        scopes: ["forms:publish" as const],
      },
      expectedRevision: 1,
    };

    await publishForm("11111111-1111-4111-8111-111111111111", request);
    await publishForm("11111111-1111-4111-8111-111111111111", {
      ...request,
      actor: { ...request.actor, grantId: secondGrantId },
    });

    const firstValues = db.query.mock.calls[0]?.[1] as unknown[];
    const secondValues = db.query.mock.calls[1]?.[1] as unknown[];

    expect(firstValues[6]).toBe(firstGrantId);
    expect(secondValues[6]).toBe(secondGrantId);
    expect(firstValues[3]).toBe(secondValues[3]);
    expect(firstValues[4]).not.toBe(secondValues[4]);
  });
});
