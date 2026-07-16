import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptSubmission: vi.fn(),
  captureError: vi.fn(),
  getPublicForm: vi.fn(),
  recordBlockedSubmission: vi.fn(),
  recordCompletion: vi.fn(),
}));

vi.mock("@/lib/forms-store", () => ({
  acceptSubmission: mocks.acceptSubmission,
  getPublicForm: mocks.getPublicForm,
  recordBlockedSubmission: mocks.recordBlockedSubmission,
}));
vi.mock("@/lib/server-telemetry", () => ({
  captureFormsOperationalError: mocks.captureError,
  durationBucket: () => "lt_100ms",
  recordFormSubmissionCompletion: mocks.recordCompletion,
}));

import { GET, OPTIONS, POST } from "./route";

const context = { params: Promise.resolve({ endpoint: "frm_test" }) };
const form = {
  definition: {
    schemaVersion: 1 as const,
    title: "Contact us",
    fields: [{ id: "c9317272-29fb-4ed6-92de-2aa36fa76158", key: "email", type: "email" as const, label: "Email", required: true, hidden: false }],
    confirmation: { title: "Response received", message: "Thanks, your response was received." },
    settings: { allowedOrigins: [] },
    presentation: { colorMode: "dark" as const, accentColor: "#c6f24e", backgroundColor: "#0e1219", textColor: "#f2f4f7", fontFamily: "sans" as const, spacing: "comfortable" as const, buttonStyle: "solid" as const },
  },
};

function hostedRequest(token?: string) {
  const body = new FormData();
  body.set("_jobing_form_context", "hosted");
  body.set("_submission_id", "submission-test");
  if (token) body.set("cf-turnstile-response", token);
  body.set("email", "person@example.com");
  return new Request("https://forms.jobing.site/forms/f/frm_test", {
    method: "POST",
    headers: { origin: "https://forms.jobing.site" },
    body,
  });
}

function customRequestWithChallenge() {
  const body = new FormData();
  body.set("_submission_id", "submission-test");
  body.set("_jobing_form_context", "hosted");
  body.set("cf-turnstile-response", "browser-token");
  body.set("email", "person@example.com");
  return new Request("https://forms.jobing.site/forms/f/frm_test", {
    method: "POST",
    headers: { accept: "application/json", origin: "https://customer.example" },
    body,
  });
}

describe("public form submission telemetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.stubEnv("PAGES_RUNTIME_ROOT_DOMAIN", "jobing.online");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("records exactly one CORS-safe completion for a missing form", async () => {
    mocks.getPublicForm.mockResolvedValue(null);
    const response = await POST(new Request("https://forms.jobing.site/forms/f/frm_test", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: "https://launch.jobing.online",
      },
      body: JSON.stringify({ email: "person@example.com" }),
    }), context);

    expect(response.status).toBe(404);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://launch.jobing.online");
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.recordCompletion).toHaveBeenCalledWith({
      outcome: "rejected",
      reason: "form_not_found",
      status_code: 404,
      response_mode: "json",
      source: "generated_page",
      duration_bucket: "lt_100ms",
    });
    expect(mocks.recordCompletion.mock.calls[0]?.[0]).not.toHaveProperty("email");
  });

  it("records and reports an unexpected storage failure once as a controlled response", async () => {
    const error = new Error("database unavailable");
    mocks.getPublicForm.mockRejectedValue(error);
    const request = new Request("https://forms.jobing.site/forms/f/frm_test", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://launch.jobing.online" },
      body: "{}",
    });

    const response = await POST(request, context);
    expect(response.status).toBe(500);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://launch.jobing.online");
    await expect(response.json()).resolves.toMatchObject({ error: { code: "submission_failed" } });
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(mocks.captureError).toHaveBeenCalledWith(error, expect.objectContaining({
      outcome: "unavailable",
      reason: "unhandled_exception",
      status_code: 500,
    }));
  });

  it("does not make the hosted form depend on a browser challenge", async () => {
    vi.stubEnv("TURNSTILE_VERIFY_URL", "https://verify.example.test");
    vi.stubEnv("SUBMISSION_IP_HASH_SECRET", "0123456789abcdef0123456789abcdef");
    mocks.getPublicForm.mockResolvedValue(form);
    mocks.acceptSubmission.mockResolvedValue({ responseId: "response-test" });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(hostedRequest(), context);

    expect(response.status).toBe(303);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.acceptSubmission).toHaveBeenCalledTimes(1);
  });

  it("reports an unavailable verifier for custom sites that opt into Turnstile", async () => {
    vi.stubEnv("TURNSTILE_VERIFY_URL", "");
    mocks.getPublicForm.mockResolvedValue(form);

    const response = await POST(customRequestWithChallenge(), context);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "security_check_unavailable" } });
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(mocks.acceptSubmission).not.toHaveBeenCalled();
  });

  it("accepts a hosted form exactly once after a successful challenge", async () => {
    vi.stubEnv("TURNSTILE_VERIFY_URL", "https://verify.example.test");
    vi.stubEnv("SUBMISSION_IP_HASH_SECRET", "0123456789abcdef0123456789abcdef");
    mocks.getPublicForm.mockResolvedValue(form);
    mocks.acceptSubmission.mockResolvedValue({ responseId: "response-test" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "forms.jobing.site",
      action: "turnstile-spin-v1",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const response = await POST(customRequestWithChallenge(), context);

    expect(response.status).toBe(201);
    expect(mocks.acceptSubmission).toHaveBeenCalledTimes(1);
    expect(mocks.recordCompletion).toHaveBeenCalledWith(expect.objectContaining({ outcome: "accepted", reason: "success" }));
  });

  it("treats a verifier hostname mismatch as an operational failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_FORMS_API_URL", "https://forms.jobing.site/forms");
    vi.stubEnv("TURNSTILE_VERIFY_URL", "https://verify.example.test");
    vi.stubEnv("SUBMISSION_IP_HASH_SECRET", "0123456789abcdef0123456789abcdef");
    mocks.getPublicForm.mockResolvedValue(form);
    mocks.acceptSubmission.mockResolvedValue({ responseId: "response-test" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "jobing.site",
      action: "turnstile-spin-v1",
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const response = await POST(customRequestWithChallenge(), context);

    expect(response.status).toBe(503);
    expect(mocks.acceptSubmission).not.toHaveBeenCalled();
    expect(mocks.captureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({
      outcome: "unavailable",
      reason: "security_check_unavailable",
    }));
  });

  it("treats a verifier secret mismatch as an operational failure", async () => {
    vi.stubEnv("TURNSTILE_VERIFY_URL", "https://verify.example.test");
    mocks.getPublicForm.mockResolvedValue(form);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: false,
      "error-codes": ["invalid-input-secret"],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const response = await POST(customRequestWithChallenge(), context);

    expect(response.status).toBe(503);
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(mocks.acceptSubmission).not.toHaveBeenCalled();
  });

  it("serves a hosted form even when third-party security services are unavailable", async () => {
    mocks.getPublicForm.mockResolvedValue(form);

    const response = await GET(new Request("https://forms.jobing.site/forms/f/frm_test"), context);

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).not.toContain("challenges.cloudflare.com");
    expect(body).toContain('<button type="submit" data-submit-button>');
  });

  it("serves the normal hosted form through the CDN without embedding a shared submission ID", async () => {
    mocks.getPublicForm.mockResolvedValue(form);

    const response = await GET(new Request("https://forms.jobing.site/forms/f/frm_test"), context);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=15");
    expect(body).toContain('name="_submission_id" value=""');
  });

  it("never caches the post-submit confirmation document", async () => {
    mocks.getPublicForm.mockResolvedValue(form);

    const response = await GET(new Request("https://forms.jobing.site/forms/f/frm_test?submitted=1"), context);

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("allows browser fetch submissions when a form intentionally has no origin allowlist", async () => {
    mocks.getPublicForm.mockResolvedValue(form);
    const response = await OPTIONS(new Request("https://forms.jobing.site/forms/f/frm_test", {
      method: "OPTIONS",
      headers: { origin: "https://customer.example" },
    }), context);
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://customer.example");
  });

  it("keeps an explicit origin allowlist strict", async () => {
    mocks.getPublicForm.mockResolvedValue({
      ...form,
      definition: { ...form.definition, settings: { allowedOrigins: ["https://approved.example"] } },
    });
    const response = await OPTIONS(new Request("https://forms.jobing.site/forms/f/frm_test", {
      method: "OPTIONS",
      headers: { origin: "https://unapproved.example" },
    }), context);
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
