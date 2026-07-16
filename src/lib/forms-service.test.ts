import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createConnectorForm,
  listConnectorFormResponses,
  setConnectorFormResponseState,
  updateConnectorForm,
  FormsServiceError,
  formsSignaturePayload,
  MAX_FORMS_INTERNAL_REQUEST_BYTES,
  publicFormsEndpointUrl,
  signFormsRequest,
  syncFormsWorkspaceProjection,
} from "./forms-service";

const actor = {
  userId: "user_123",
  clientId: "client_123",
  grantId: "5df42931-5953-42a0-bd90-7581a79326db",
  scopes: ["forms:write"],
};

const form = {
  name: "Contact",
  definition: {
    schemaVersion: 1 as const,
    title: "Contact us",
    fields: [{
      id: "fe8bbf8d-a7cb-431e-b813-9122ea880ed1",
      key: "email",
      type: "email" as const,
      label: "Email",
      placeholder: "you@example.com",
      required: true,
    }],
  },
};

const workspaceResponse = {
  data: {
    workspaceId: "f3048401-b09e-49fd-9dff-51ec6f5df117",
    applied: false,
  },
};

const createdResponse = {
  data: {
    id: "4e279eaf-0a6e-48de-a66e-3c819f3fb756",
    name: "Contact",
    status: "draft",
    revision: 1,
    endpointId: "fm_public",
  },
};

const projection = {
  operationId: "clerk-delete:evt_test_1234",
  workspace: {
    sourceWorkspaceId: "user_123",
    kind: "personal" as const,
    displayName: "Personal workspace",
    status: "deleted" as const,
    sourceVersion: 2,
  },
  membership: {
    actorId: "user_123",
    role: "owner" as const,
    status: "removed" as const,
    sourceVersion: 2,
  },
  entitlement: {
    planKey: "free",
    status: "cancelled" as const,
    sourceVersion: 2,
    features: {},
    limits: {},
  },
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("FORMS_SERVICE_URL", "https://forms.jobing.site/forms");
  vi.stubEnv("FORMS_INTERNAL_KEY_ID", "phase1");
  vi.stubEnv("FORMS_INTERNAL_SECRET", "a-secret-that-is-at-least-thirty-two-characters");
});

describe("Forms internal request signing", () => {
  it("publishes form actions only on the dedicated Forms deployment", () => {
    expect(publicFormsEndpointUrl("frm_public"))
      .toBe("https://forms.jobing.site/forms/f/frm_public");
  });

  it("uses the documented canonical payload and base64url HMAC", () => {
    const input = {
      method: "post",
      path: "/api/internal/v1/forms",
      timestamp: 1_700_000_000,
      nonce: "1234567890abcdef",
      bodySha256: "a".repeat(64),
    };
    const expected = crypto.createHmac("sha256", "secret").update([
      "v1",
      "POST",
      input.path,
      String(input.timestamp),
      input.nonce,
      input.bodySha256,
    ].join("\n")).digest("base64url");

    expect(formsSignaturePayload(input)).toContain("POST\n/api/internal/v1/forms");
    expect(signFormsRequest("secret", input)).toBe(expected);
  });

  it("signs the exact request body sent to Forms", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createConnectorForm(actor, form, "operation-123");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = String(init.body);
    expect(url).toBe("https://forms.jobing.site/forms/api/internal/v1/forms");
    expect(headers["x-jobing-content-sha256"]).toBe(crypto.createHash("sha256").update(body).digest("hex"));
    expect(headers["x-jobing-signature"]).toBe(`v1=${signFormsRequest(
      "a-secret-that-is-at-least-thirty-two-characters",
      {
        method: "POST",
        path: "/forms/api/internal/v1/forms",
        timestamp: Number(headers["x-jobing-timestamp"]),
        nonce: headers["x-jobing-nonce"],
        bodySha256: headers["x-jobing-content-sha256"],
      },
    )}`);
    expect(JSON.parse(body)).toMatchObject({ operationId: "operation-123", actor, form });
  });

  it("syncs a missing workspace once, then retries the exact create request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "forbidden", message: "Workspace unavailable." } }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceResponse), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createConnectorForm({ ...actor, userId: "user_first_use" }, form, "operation-first-use");

    expect(fetchMock.mock.calls[1][0]).toBe("https://forms.jobing.site/forms/api/internal/v1/workspaces/sync");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      workspace: { sourceWorkspaceId: "user_first_use" },
      membership: { actorId: "user_first_use" },
      entitlement: { limits: { "forms.total": 5, "forms.published": 5 } },
    });
    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[2][1]?.body);
  });

  it("does not expose a public endpoint for an unpublished draft", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createConnectorForm(actor, form, "operation-123");

    expect(result).not.toHaveProperty("endpointUrl");
    expect(result).not.toHaveProperty("endpointId");
    expect(result).toMatchObject({ status: "draft", publishRequired: true });
    expect(result.iframeSupported).toBe(false);
    expect(result.htmlTemplate).toContain('<form method="POST" enctype="multipart/form-data" action="{{JOBING_FORM_ACTION}}">');
    expect(result.htmlTemplate).toContain('name="email"');
    expect(result.htmlTemplate).toContain('placeholder="you@example.com"');
    expect(result.htmlTemplate).not.toContain("iframe");
  });

  it("retries a server failure with the same body and a fresh nonce", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "temporary", message: "Try again." } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createConnectorForm(actor, form, "operation-123");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[1][1]?.body);
    const firstHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(firstHeaders["x-jobing-nonce"]).not.toBe(secondHeaders["x-jobing-nonce"]);
  });

  it("does not retry a safe client error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "scope_denied", message: "This connector cannot create forms." },
      }), { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({
      code: "scope_denied",
      status: 403,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives the AI a direct pricing URL when the free form limit is reached", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "form_limit_reached", message: "Internal plan detail." },
      }), { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({
      code: "form_limit_reached",
      message: expect.stringContaining("https://jobing.site/pricing?from=connector-limit"),
      status: 409,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects unsafe or incomplete service configuration before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FORMS_SERVICE_URL", "http://jobing.site/forms");

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toBeInstanceOf(FormsServiceError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", () => new Response(null, { status: 503 })],
    ["HTML", () => new Response("<h1>upstream error</h1>", { status: 503 })],
    ["oversized", () => new Response("x".repeat(1024 * 1024 + 1), { status: 503 })],
  ])("retries a %s 5xx response based on status before parsing its body", async (_label, failureResponse) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(failureResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).resolves.toMatchObject({ name: "Contact" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[1][1]?.body);
  });

  it("retries a network failure with the exact same serialized request", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("socket closed"))
      .mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createConnectorForm(actor, form, "operation-123");

    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[1][1]?.body);
    const firstHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(firstHeaders["x-jobing-nonce"]).not.toBe(secondHeaders["x-jobing-nonce"]);
  });

  it("caps successful response streams at one MiB", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("x".repeat(1024 * 1024 + 1), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({
      code: "invalid_response",
      status: 502,
      message: "Forms returned an invalid response.",
    });
  });

  it("does not expose invalid upstream error bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("<p>database password: secret</p>", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({
      code: "request_failed",
      status: 400,
      message: "Forms could not complete the request.",
    });
  });

  it("does not expose messages from otherwise valid upstream error envelopes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "bad_request", message: "database password: secret" },
      }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({
      code: "bad_request",
      status: 400,
      message: "Forms could not complete the request.",
    });
  });

  it("rejects the aggregate 256 KiB internal envelope before workspace sync", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const oversized = {
      ...form,
      description: "x".repeat(MAX_FORMS_INTERNAL_REQUEST_BYTES),
    };

    await expect(createConnectorForm(actor, oversized, "operation-123")).rejects.toMatchObject({
      code: "request_too_large",
      status: 413,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pins production to the Jobing Forms base URL unless a base URL is explicitly allowed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FORMS_SERVICE_URL", "https://jobing.site.attacker.example/forms");

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({ code: "invalid_configuration" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("supports an explicit HTTPS production base URL allowlist", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(createdResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FORMS_SERVICE_URL", "https://preview.example.com/forms");
    vi.stubEnv("FORMS_SERVICE_ALLOWED_BASE_URLS", "https://preview.example.com/forms");

    await createConnectorForm(actor, form, "operation-123");
    expect(fetchMock.mock.calls[0][0]).toBe("https://preview.example.com/forms/api/internal/v1/forms");
  });

  it("validates signing key IDs and secret bytes before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FORMS_INTERNAL_KEY_ID", "bad key id");

    await expect(createConnectorForm(actor, form, "operation-123")).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends lifecycle workspace projections without changing their body", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(workspaceResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(syncFormsWorkspaceProjection(projection)).resolves.toEqual(workspaceResponse.data);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(projection));
  });

  it("updates a form through the revision-guarded draft endpoint", async () => {
    const updated = {
      data: {
        id: createdResponse.data.id,
        name: "Contact leads",
        status: "draft",
        revision: 2,
        endpointId: "frm_public",
        definition: form.definition,
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(updated), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateConnectorForm(actor, createdResponse.data.id, {
      expectedRevision: 1,
      name: "Contact leads",
      definition: form.definition,
    });

    expect(result).toMatchObject({ name: "Contact leads", revision: 2, publishRequired: true });
    expect(fetchMock.mock.calls[0][0]).toBe(`https://forms.jobing.site/forms/api/internal/v1/forms/${createdResponse.data.id}/draft`);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ expectedRevision: 1, actor });
  });

  it("reads paginated response values without fetching uploaded file contents", async () => {
    const responseId = "9cc5b748-a4f6-4ccb-b737-29f05e6c6f62";
    const responses = {
      data: {
        items: [{
          id: responseId,
          formId: createdResponse.data.id,
          receivedAt: "2026-07-15T00:00:00Z",
          values: { email: "person@example.com" },
          reviewState: "inbox",
          fileCount: 1,
          files: [{
            id: "4fa5720d-26da-4bb8-9458-b6119d25b4de",
            submissionId: responseId,
            fieldKey: "resume",
            fileName: "resume.pdf",
            contentType: "application/pdf",
            byteSize: 1024,
            scanStatus: "unscanned",
          }],
        }],
        total: 1,
        page: 1,
        pageSize: 20,
        pages: 1,
      },
    };
    const responseActor = { ...actor, scopes: ["forms.responses:read"] };
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(responses), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await listConnectorFormResponses(responseActor, createdResponse.data.id, { query: "person", page: 1, pageSize: 20 });

    expect(result.items[0]).not.toHaveProperty("contentBase64");
    expect(result.items[0].files[0]).toMatchObject({ fileName: "resume.pdf", byteSize: 1024 });
    expect(fetchMock.mock.calls[0][0]).toContain(`/forms/${createdResponse.data.id}/responses`);
  });

  it("moves a response to an inbox state through a dedicated endpoint", async () => {
    const submissionId = "9cc5b748-a4f6-4ccb-b737-29f05e6c6f62";
    const stateResponse = { data: { submissionId, state: "archived" } };
    const responseActor = { ...actor, scopes: ["forms.responses:write"] };
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(stateResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(setConnectorFormResponseState(responseActor, submissionId, "archived"))
      .resolves.toEqual(stateResponse.data);
    expect(fetchMock.mock.calls[0][0]).toContain(`/responses/${submissionId}/state`);
  });
});
