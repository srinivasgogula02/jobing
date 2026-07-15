import { beforeEach, describe, expect, it, vi } from "vitest";

type RegisteredTool = {
  config: Record<string, unknown>;
  handler: (input: unknown, context: { authInfo?: unknown }) => Promise<unknown>;
};

const state = vi.hoisted(() => ({
  tools: new Map<string, RegisteredTool>(),
  reportFeedback: vi.fn(),
  listFormResponses: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("mcp-handler", () => ({
  createMcpHandler: (register: (server: { registerTool: (name: string, config: Record<string, unknown>, handler: RegisteredTool["handler"]) => void }) => void) => {
    register({
      registerTool(name, config, handler) {
        state.tools.set(name, { config, handler });
      },
    });
    return vi.fn();
  },
  withMcpAuth: (handler: unknown) => handler,
}));
vi.mock("@/lib/connected-tools", () => ({
  createConnectedNote: vi.fn(),
  deleteConnectedPage: vi.fn(),
  deployConnectedPage: vi.fn(),
  getConnectedPage: vi.fn(),
  listConnectedPages: vi.fn(),
  updateConnectedPage: vi.fn(),
}));
vi.mock("@/lib/forms-service", () => ({
  FormsServiceError: class FormsServiceError extends Error {},
  createConnectorForm: vi.fn(),
  duplicateConnectorForm: vi.fn(),
  listConnectorForms: vi.fn(),
  listConnectorFormResponses: state.listFormResponses,
  publishConnectorForm: vi.fn(),
  setConnectorFormResponseState: vi.fn(),
  updateConnectorForm: vi.fn(),
}));
vi.mock("@/lib/connector-feedback", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/connector-feedback")>();
  return { ...original, reportConnectorFeedback: state.reportFeedback };
});
vi.mock("@/lib/oauth", () => ({ consumeConnectorRateLimit: vi.fn(), validateAccessTokenInfo: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(() => true), requestIp: vi.fn(() => "127.0.0.1") }));

await import("./route");

const authInfo = {
  clientId: "client_123",
  scopes: ["feedback:write"],
  extra: {
    userId: "user_123",
    grantId: "5df42931-5953-42a0-bd90-7581a79326db",
  },
};

beforeEach(() => {
  state.reportFeedback.mockReset();
  state.listFormResponses.mockReset();
});

describe("Jobing MCP management tools", () => {
  it("registers the relevant Phase 2 page and form management capabilities", () => {
    expect([...state.tools.keys()]).toEqual(expect.arrayContaining([
      "list_pages",
      "get_page",
      "update_page",
      "delete_page",
      "update_form_draft",
      "duplicate_form",
      "list_form_responses",
      "set_form_response_state",
    ]));
    expect(state.tools.get("delete_page")?.config.annotations).toMatchObject({ destructiveHint: true, readOnlyHint: false });
    expect(state.tools.get("list_form_responses")?.config.annotations).toMatchObject({ readOnlyHint: true });
  });

  it("reads response data only with the dedicated permission", async () => {
    state.listFormResponses.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, pages: 1 });
    const tool = state.tools.get("list_form_responses");
    const responseAuth = { ...authInfo, scopes: ["forms.responses:read"] };
    const input = {
      formId: "4e279eaf-0a6e-48de-a66e-3c819f3fb756",
      state: "inbox",
      sort: "newest",
      page: 1,
      pageSize: 20,
    };

    const result = await tool?.handler(input, { authInfo: responseAuth });
    expect(state.listFormResponses).toHaveBeenCalled();
    expect(result).toMatchObject({ structuredContent: { total: 0 } });

    state.listFormResponses.mockClear();
    const denied = await tool?.handler(input, { authInfo: { ...authInfo, scopes: ["forms:read"] } });
    expect(state.listFormResponses).not.toHaveBeenCalled();
    expect(denied).toMatchObject({ isError: true });
  });
});

describe("Jobing MCP feedback tool", () => {
  it("registers a user-confirmed, idempotent external-write tool and returns its receipt", async () => {
    const tool = state.tools.get("report_connector_feedback");
    expect(tool).toBeDefined();
    expect(tool?.config.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
    state.reportFeedback.mockResolvedValue({
      id: "26e38d04-fbc0-43bf-8892-d03b064922f6",
      createdAt: "2026-07-14T16:30:00.000Z",
      duplicate: false,
    });

    const input = {
      operationId: "feedback:resume-upload:v1",
      kind: "missing_capability",
      useCase: "job_application",
      blockedTool: "deploy_page",
      summary: "The user needs applicants to upload a resume.",
      userConfirmed: true,
    };
    const result = await tool?.handler(input, { authInfo });

    expect(state.reportFeedback).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user_123",
      clientId: "client_123",
      grantId: "5df42931-5953-42a0-bd90-7581a79326db",
    }), input);
    expect(result).toEqual({
      content: [{ type: "text", text: "Product feedback sent to Jobing. Reference: 26e38d04-fbc0-43bf-8892-d03b064922f6." }],
      structuredContent: {
        feedbackId: "26e38d04-fbc0-43bf-8892-d03b064922f6",
        duplicate: false,
      },
    });
  });

  it("fails closed when an existing connector lacks feedback permission", async () => {
    const tool = state.tools.get("report_connector_feedback");
    const result = await tool?.handler({
      operationId: "feedback:missing-scope:v1",
      kind: "idea",
      useCase: "other",
      summary: "The user wants another product capability.",
      userConfirmed: true,
    }, {
      authInfo: { ...authInfo, scopes: ["pages:write"] },
    });

    expect(state.reportFeedback).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [{
        type: "text",
        text: "This connector has not been granted feedback:write. Reconnect Jobing and approve that permission.",
      }],
    });
  });
});
