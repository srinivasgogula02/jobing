import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db }));

import { reportConnectorFeedback } from "./connector-feedback";

const actor = {
  userId: "user_123",
  clientId: "client_123",
  grantId: "5df42931-5953-42a0-bd90-7581a79326db",
  scopes: ["feedback:write"],
};

beforeEach(() => {
  db.rpc.mockReset();
});

describe("connector feedback", () => {
  it("stores a confirmed, structured report under the authenticated connector actor", async () => {
    db.rpc.mockResolvedValue({
      data: {
        id: "26e38d04-fbc0-43bf-8892-d03b064922f6",
        createdAt: "2026-07-14T16:30:00.000Z",
        duplicate: false,
      },
      error: null,
    });

    await expect(reportConnectorFeedback(actor, {
      operationId: "feedback:freshmart-job-application:v1",
      kind: "missing_capability",
      useCase: "job_application",
      blockedTool: "deploy_page",
      summary: "The user needs applicants to upload a resume.",
      userConfirmed: true,
    })).resolves.toEqual({
      id: "26e38d04-fbc0-43bf-8892-d03b064922f6",
      createdAt: "2026-07-14T16:30:00.000Z",
      duplicate: false,
    });

    expect(db.rpc).toHaveBeenCalledWith("submit_connector_feedback", {
      p_user_id: "user_123",
      p_client_id: "client_123",
      p_grant_id: "5df42931-5953-42a0-bd90-7581a79326db",
      p_operation_id: "feedback:freshmart-job-application:v1",
      p_kind: "missing_capability",
      p_use_case: "job_application",
      p_blocked_tool: "deploy_page",
      p_summary: "The user needs applicants to upload a resume.",
      p_user_confirmed: true,
    });
  });

  it("rejects feedback unless the user explicitly confirmed sending it", async () => {
    await expect(reportConnectorFeedback(actor, {
      operationId: "feedback:unconfirmed-report:v1",
      kind: "idea",
      useCase: "website",
      summary: "The user would like reusable page sections.",
      userConfirmed: false,
    })).rejects.toThrow("Confirm with the user before sending feedback");

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it.each([
    "Contact me at owner@example.com about this feature.",
    "Call the user on +91 98765 43210.",
    "The failing page is https://private.example/customer/42.",
    "<form><input name=\"email\"></form>",
    "API key: sk-secret-value",
    "First line\nfull prompt transcript follows",
  ])("rejects summaries containing PII, URLs, HTML, secrets, or transcripts", async (summary) => {
    await expect(reportConnectorFeedback(actor, {
      operationId: "feedback:privacy-check:v1",
      kind: "bug",
      useCase: "website",
      summary,
      userConfirmed: true,
    })).rejects.toThrow("Do not include personal data, URLs, HTML, secrets, or conversation text");

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("requires a stable ASCII idempotency key", async () => {
    await expect(reportConnectorFeedback(actor, {
      operationId: "bad id with spaces",
      kind: "idea",
      useCase: "other",
      summary: "Add a reusable workflow for recurring requests.",
      userConfirmed: true,
    })).rejects.toThrow("Use a stable ASCII operation ID");

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["FEEDBACK_RATE_LIMITED", "Too many feedback reports were sent. Try again later."],
    ["FEEDBACK_IDEMPOTENCY_CONFLICT", "This feedback operation ID was already used with different details."],
    ["CONNECTOR_FEEDBACK_UNAUTHORIZED", "This connector is not allowed to send product feedback."],
    ["relation public.connector_feedback does not exist", "Feedback could not be saved right now."],
  ])("maps storage failures to a bounded public error", async (storageMessage, publicMessage) => {
    db.rpc.mockResolvedValue({ data: null, error: { message: storageMessage } });

    await expect(reportConnectorFeedback(actor, {
      operationId: "feedback:safe-storage-error:v1",
      kind: "other",
      useCase: "other",
      summary: "The requested workflow could not be completed.",
      userConfirmed: true,
    })).rejects.toThrow(publicMessage);
  });

  it("never exposes an unexpected storage exception", async () => {
    db.rpc.mockRejectedValue(new Error("postgres connection includes secret details"));

    await expect(reportConnectorFeedback(actor, {
      operationId: "feedback:unexpected-storage-error:v1",
      kind: "bug",
      useCase: "form_only",
      summary: "The feedback workflow is temporarily unavailable.",
      userConfirmed: true,
    })).rejects.toThrow("Feedback could not be saved right now.");
  });
});
