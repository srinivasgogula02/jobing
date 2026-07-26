import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex, signInternalPayload } from "@/lib/internal-auth";

const store = vi.hoisted(() => ({
  claimRequestNonce: vi.fn(),
  createFormDraft: vi.fn(),
  listFormsForActor: vi.fn(),
  listFormSummariesForActor: vi.fn(),
  getFormForActor: vi.fn(),
  publishForm: vi.fn(),
  updateDashboardForm: vi.fn(),
  listSubmissionsPage: vi.fn(),
  setSubmissionReviewState: vi.fn(),
  applyWorkspaceProjection: vi.fn(),
  listFormIntegrationsForActor: vi.fn(),
  saveFormIntegration: vi.fn(),
  setFormIntegrationStatus: vi.fn(),
  deleteFormIntegration: vi.fn(),
}));

vi.mock("@/lib/forms-store", () => store);

import { POST as createForm } from "./forms/route";
import { POST as listForms } from "./forms/list/route";
import { POST as getForm } from "./forms/[formId]/route";
import { POST as publishForm } from "./forms/[formId]/publish/route";
import { POST as updateFormDraft } from "./forms/[formId]/draft/route";
import { POST as listFormResponses } from "./forms/[formId]/responses/route";
import { POST as formIntegrations } from "./forms/[formId]/integrations/route";
import { POST as setFormResponseState } from "./responses/[submissionId]/state/route";
import { POST as syncWorkspace } from "./workspaces/sync/route";

const SECRET = "phase-one-test-secret-with-enough-entropy";
const FORM_ID = "11111111-1111-4111-8111-111111111111";
const FIELD_ID = "22222222-2222-4222-8222-222222222222";
const WORKSPACE_ID = "33333333-3333-4333-8333-333333333333";
const SUBMISSION_ID = "55555555-5555-4555-8555-555555555555";

function actor(scopes: string[]) {
  return {
    userId: "user_123",
    clientId: "client_123",
    grantId: "44444444-4444-4444-8444-444444444444",
    scopes,
  };
}

function signedRequest(path: string, value: unknown, nonce = `nonce_${crypto.randomUUID().replaceAll("-", "")}`) {
  const rawBody = JSON.stringify(value);
  const timestamp = Math.floor(Date.now() / 1000);
  const bodySha256 = sha256Hex(rawBody);
  const routedPath = `/forms${path}`;
  const signature = signInternalPayload(SECRET, { method: "POST", path: routedPath, timestamp, nonce, bodySha256 });
  return {
    rawBody,
    request: new Request(`https://jobing.site${routedPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-jobing-key-id": "phase1",
        "x-jobing-timestamp": String(timestamp),
        "x-jobing-nonce": nonce,
        "x-jobing-content-sha256": bodySha256,
        "x-jobing-signature": `v1=${signature}`,
      },
      body: rawBody,
    }),
  };
}

function createPayload(scopes = ["forms:write"]) {
  return {
    operationId: "operation-create-123",
    actor: actor(scopes),
    form: {
      name: "Contact",
      definition: {
        schemaVersion: 1,
        title: "Contact us",
        fields: [{ id: FIELD_ID, key: "email", type: "email", label: "Email", required: true }],
      },
    },
  };
}

beforeEach(() => {
  vi.stubEnv("FORMS_INTERNAL_KEY_ID", "phase1");
  vi.stubEnv("FORMS_INTERNAL_SECRET", SECRET);
  store.claimRequestNonce.mockReset().mockResolvedValue(true);
  store.createFormDraft.mockReset().mockResolvedValue({ id: FORM_ID, status: "draft" });
  store.listFormsForActor.mockReset().mockResolvedValue([{ id: FORM_ID, name: "Contact", status: "draft" }]);
  store.listFormSummariesForActor.mockReset().mockResolvedValue([{ id: FORM_ID, name: "Contact", status: "draft", fieldCount: 1 }]);
  store.getFormForActor.mockReset().mockResolvedValue({ id: FORM_ID, name: "Contact", status: "published", revision: 2, publishedVersion: 1, endpointId: "frm_public", updatedAt: "2026-07-16T00:00:00Z", definition: createPayload().form.definition });
  store.publishForm.mockReset().mockResolvedValue({ id: FORM_ID, status: "published", version: 1 });
  store.updateDashboardForm.mockReset().mockResolvedValue({ id: FORM_ID, name: "Contact", status: "published", revision: 2, definition: createPayload().form.definition });
  store.listSubmissionsPage.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, pages: 1 });
  store.setSubmissionReviewState.mockReset().mockResolvedValue(true);
  store.applyWorkspaceProjection.mockReset().mockResolvedValue({ workspaceId: WORKSPACE_ID, applied: true });
  store.listFormIntegrationsForActor.mockReset().mockResolvedValue([]);
  store.saveFormIntegration.mockReset().mockResolvedValue({
    id: "66666666-6666-4666-8666-666666666666",
    formId: FORM_ID,
    provider: "slack",
    status: "active",
    config: { title: "New lead" },
    hasSecret: true,
    updatedAt: "2026-07-26T12:00:00.000Z",
  });
  store.setFormIntegrationStatus.mockReset().mockResolvedValue(true);
  store.deleteFormIntegration.mockReset().mockResolvedValue(true);
});

describe("Forms internal routes", () => {
  it("rejects oversized bodies before buffering or touching the database", async () => {
    const request = new Request("https://jobing.site/forms/api/internal/v1/forms", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": String(256 * 1024 + 1) },
    });
    const response = await createForm(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: { code: "body_too_large", message: "The internal request body is too large." },
    });
    expect(store.claimRequestNonce).not.toHaveBeenCalled();
  });

  it("creates a draft from a signed request without emitting CORS headers", async () => {
    const { request } = signedRequest("/api/internal/v1/forms", createPayload());
    const response = await createForm(request);

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(await response.json()).toEqual({ data: { id: FORM_ID, status: "draft" } });
    expect(store.createFormDraft).toHaveBeenCalledWith(expect.objectContaining({ operationId: "operation-create-123" }));
  });

  it("requires the exact write permission for draft creation", async () => {
    const { request } = signedRequest("/api/internal/v1/forms", createPayload(["forms:read"]));
    const response = await createForm(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "insufficient_scope",
        message: "The connected account has not granted the required Forms permission.",
      },
    });
    expect(store.createFormDraft).not.toHaveBeenCalled();
  });

  it("lists only through the signed POST endpoint and read scope", async () => {
    const { request } = signedRequest("/api/internal/v1/forms/list", { actor: actor(["forms:read"]) });
    const response = await listForms(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { forms: [{ id: FORM_ID, name: "Contact", status: "draft" }] } });
    expect(store.listFormsForActor).toHaveBeenCalledWith("user_123");
  });

  it("returns lightweight form cards without serializing full definitions", async () => {
    const { request } = signedRequest("/api/internal/v1/forms/list", { actor: actor(["forms:read"]), includeDefinition: false });
    const response = await listForms(request);

    expect(response.status).toBe(200);
    expect(store.listFormSummariesForActor).toHaveBeenCalledWith("user_123");
    expect(store.listFormsForActor).not.toHaveBeenCalled();
  });

  it("loads one requested form through the read scope", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}`;
    const { request } = signedRequest(path, { actor: actor(["forms:read"]) });
    const response = await getForm(request, { params: Promise.resolve({ formId: FORM_ID }) });

    expect(response.status).toBe(200);
    expect(store.getFormForActor).toHaveBeenCalledWith("user_123", FORM_ID);
  });

  it("requires publish scope and forwards the path form ID", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}/publish`;
    const payload = {
      operationId: "operation-publish-123",
      actor: actor(["forms:publish"]),
      expectedRevision: 1,
    };
    const { request } = signedRequest(path, payload);
    const response = await publishForm(request, { params: Promise.resolve({ formId: FORM_ID }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: FORM_ID, status: "published", version: 1, definition: createPayload().form.definition } });
    expect(store.publishForm).toHaveBeenCalledWith(FORM_ID, expect.objectContaining({ expectedRevision: 1 }));
  });

  it("updates a revisioned form draft through the write scope", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}/draft`;
    const payload = {
      actor: actor(["forms:write"]),
      expectedRevision: 1,
      name: "Contact",
      definition: createPayload().form.definition,
    };
    const { request } = signedRequest(path, payload);
    const response = await updateFormDraft(request, { params: Promise.resolve({ formId: FORM_ID }) });

    expect(response.status).toBe(200);
    expect(store.updateDashboardForm).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "user_123",
      formId: FORM_ID,
      expectedRevision: 1,
    }));
  });

  it("reads searchable responses only with the dedicated private-data scope", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}/responses`;
    const payload = { actor: actor(["forms.responses:read"]), query: "designer", state: "inbox", sort: "newest", page: 1, pageSize: 20 };
    const { request } = signedRequest(path, payload);
    const response = await listFormResponses(request, { params: Promise.resolve({ formId: FORM_ID }) });

    expect(response.status).toBe(200);
    expect(store.listSubmissionsPage).toHaveBeenCalledWith(expect.objectContaining({ actorId: "user_123", formId: FORM_ID, query: "designer" }));

    const denied = signedRequest(path, { ...payload, actor: actor(["forms:read"]) });
    const deniedResponse = await listFormResponses(denied.request, { params: Promise.resolve({ formId: FORM_ID }) });
    expect(deniedResponse.status).toBe(403);
  });

  it("moves a response between inbox states with its own write permission", async () => {
    const path = `/api/internal/v1/responses/${SUBMISSION_ID}/state`;
    const { request } = signedRequest(path, { actor: actor(["forms.responses:write"]), state: "archived" });
    const response = await setFormResponseState(request, { params: Promise.resolve({ submissionId: SUBMISSION_ID }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { submissionId: SUBMISSION_ID, state: "archived" } });
    expect(store.setSubmissionReviewState).toHaveBeenCalledWith("user_123", SUBMISSION_ID, "archived");
  });

  it("lists integration state with read scope and never returns stored credentials", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}/integrations`;
    store.listFormIntegrationsForActor.mockResolvedValueOnce([{
      id: "66666666-6666-4666-8666-666666666666",
      formId: FORM_ID,
      provider: "slack",
      status: "active",
      config: { title: "New lead" },
      hasSecret: true,
      updatedAt: "2026-07-26T12:00:00.000Z",
    }]);
    const { request } = signedRequest(path, { action: "list", actor: actor(["forms:read"]) });
    const response = await formIntegrations(request, { params: Promise.resolve({ formId: FORM_ID }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(store.listFormIntegrationsForActor).toHaveBeenCalledWith("user_123", FORM_ID);
    expect(body.data[0]).toMatchObject({ provider: "slack", hasSecret: true });
    expect(JSON.stringify(body)).not.toContain("webhookUrl");
  });

  it("requires write scope before saving integration credentials", async () => {
    const path = `/api/internal/v1/forms/${FORM_ID}/integrations`;
    const payload = {
      action: "save",
      actor: actor(["forms:write"]),
      provider: "slack",
      config: { title: "New lead" },
      secret: { webhookUrl: "https://hooks.slack.com/services/example" },
      replaceSecret: true,
    };
    const { request } = signedRequest(path, payload);
    const response = await formIntegrations(request, { params: Promise.resolve({ formId: FORM_ID }) });

    expect(response.status).toBe(200);
    expect(store.saveFormIntegration).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "user_123",
      formId: FORM_ID,
      provider: "slack",
      replaceSecret: true,
    }));

    store.saveFormIntegration.mockClear();
    const denied = signedRequest(path, { ...payload, actor: actor(["forms:read"]) });
    const deniedResponse = await formIntegrations(denied.request, { params: Promise.resolve({ formId: FORM_ID }) });
    expect(deniedResponse.status).toBe(403);
    expect(store.saveFormIntegration).not.toHaveBeenCalled();
  });

  it("applies a signed workspace projection", async () => {
    const payload = {
      operationId: "operation-workspace-123",
      workspace: {
        sourceWorkspaceId: "jobing-workspace-123",
        kind: "personal",
        displayName: "Vinay",
        status: "active",
        sourceVersion: 1,
      },
      membership: { actorId: "user_123", role: "owner", status: "active", sourceVersion: 1 },
      entitlement: {
        planKey: "free",
        status: "active",
        sourceVersion: 1,
        features: {},
        limits: { forms: 3 },
      },
    };
    const { request, rawBody } = signedRequest("/api/internal/v1/workspaces/sync", payload);
    const response = await syncWorkspace(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { workspaceId: WORKSPACE_ID, applied: true } });
    expect(store.applyWorkspaceProjection).toHaveBeenCalledWith(expect.objectContaining({ operationId: "operation-workspace-123" }), rawBody);
  });

  it("does not expose unexpected storage errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    store.createFormDraft.mockRejectedValueOnce(new Error("password=secret database detail"));
    const { request } = signedRequest("/api/internal/v1/forms", createPayload());
    const response = await createForm(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: { code: "internal_error", message: "The Forms service could not complete the request." },
    });
    expect(JSON.stringify(body)).not.toContain("password");
    consoleError.mockRestore();
  });
});
