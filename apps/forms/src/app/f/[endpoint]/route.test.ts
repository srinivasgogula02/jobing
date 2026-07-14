import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptSubmission: vi.fn(),
  captureError: vi.fn(),
  getPublicForm: vi.fn(),
  recordCompletion: vi.fn(),
}));

vi.mock("@/lib/forms-store", () => ({
  acceptSubmission: mocks.acceptSubmission,
  getPublicForm: mocks.getPublicForm,
}));
vi.mock("@/lib/server-telemetry", () => ({
  captureFormsOperationalError: mocks.captureError,
  durationBucket: () => "lt_100ms",
  recordFormSubmissionCompletion: mocks.recordCompletion,
}));

import { POST } from "./route";

const context = { params: Promise.resolve({ endpoint: "frm_test" }) };

describe("public form submission telemetry", () => {
  beforeEach(() => {
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
});
