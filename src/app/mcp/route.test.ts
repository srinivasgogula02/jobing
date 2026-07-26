import { beforeEach, describe, expect, it, vi } from "vitest";

type RegisteredTool = {
  config: Record<string, unknown>;
  handler: (input: unknown, context: { authInfo?: unknown }) => Promise<unknown>;
};

const state = vi.hoisted(() => ({
  tools: new Map<string, RegisteredTool>(),
  reportFeedback: vi.fn(),
  listFormResponses: vi.fn(),
  listFormIntegrations: vi.fn(),
  deployPage: vi.fn(),
  createForm: vi.fn(),
  publishForm: vi.fn(),
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
  deployConnectedPage: state.deployPage,
  getConnectedPage: vi.fn(),
  listConnectedPages: vi.fn(),
  updateConnectedPage: vi.fn(),
}));
vi.mock("@/lib/forms-service", () => ({
  FormsServiceError: class FormsServiceError extends Error {},
  createConnectorForm: state.createForm,
  duplicateConnectorForm: vi.fn(),
  getFormFromService: vi.fn(),
  listConnectorForms: vi.fn(),
  listConnectorFormIntegrations: state.listFormIntegrations,
  listConnectorFormResponses: state.listFormResponses,
  publishConnectorForm: state.publishForm,
  setConnectorFormResponseState: vi.fn(),
  updateConnectorForm: vi.fn(),
}));
vi.mock("@/lib/connector-feedback", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/connector-feedback")>();
  return { ...original, reportConnectorFeedback: state.reportFeedback };
});
vi.mock("@/lib/oauth", () => ({ authorizeMcpRequest: vi.fn() }));
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
  state.listFormIntegrations.mockReset();
  state.deployPage.mockReset();
  state.createForm.mockReset();
  state.publishForm.mockReset();
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
      "list_form_integrations",
      "set_form_response_state",
    ]));
    expect(state.tools.get("delete_page")?.config.annotations).toMatchObject({ destructiveHint: true, readOnlyHint: false });
    expect(state.tools.get("list_form_responses")?.config.annotations).toMatchObject({ readOnlyHint: true });
    expect(state.tools.get("list_form_integrations")?.config.annotations).toMatchObject({ readOnlyHint: true });
  });

  it("returns the live page, editor, and Pages dashboard after deployment", async () => {
    state.deployPage.mockResolvedValue({ id: "launch-page", url: "https://launch-page.jobing.online" });
    const tool = state.tools.get("deploy_page");
    const result = await tool?.handler({ id: "launch-page", html: "<main>Launch</main>" }, {
      authInfo: { ...authInfo, scopes: ["pages:write"] },
    });

    expect(result).toMatchObject({
      structuredContent: {
        liveUrl: "https://launch-page.jobing.online",
        editUrl: "https://jobing.site/pages/launch-page/edit",
        pagesDashboardUrl: "https://jobing.site/dashboard/pages",
        nextActions: expect.arrayContaining([
          { label: "View live page", url: "https://launch-page.jobing.online" },
          { label: "Open all pages", url: "https://jobing.site/dashboard/pages" },
        ]),
      },
    });
    expect(JSON.stringify(result)).toContain("https://jobing.site/dashboard/pages");
  });

  it("returns the form editor and Forms dashboard as soon as a draft is created", async () => {
    const formId = "4e279eaf-0a6e-48de-a66e-3c819f3fb756";
    state.createForm.mockResolvedValue({ id: formId, name: "Contact", status: "draft", revision: 1 });
    const tool = state.tools.get("create_form_draft");
    const result = await tool?.handler({
      operationId: "contact-form:v1",
      name: "Contact",
      fields: [{ key: "email", type: "email", label: "Email", required: true }],
    }, { authInfo: { ...authInfo, scopes: ["forms:write"] } });

    expect(result).toMatchObject({
      structuredContent: {
        editUrl: `https://jobing.site/dashboard/forms/${formId}/edit`,
        responsesUrl: `https://jobing.site/dashboard/forms/${formId}`,
        formsDashboardUrl: "https://jobing.site/dashboard/forms",
      },
    });
    expect(JSON.stringify(result)).toContain("https://jobing.site/dashboard/forms");
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

  it("lists integration status but routes credential setup to the secure dashboard", async () => {
    const formId = "4e279eaf-0a6e-48de-a66e-3c819f3fb756";
    state.listFormIntegrations.mockResolvedValue([{
      id: "f74cc716-26bc-4526-8d15-ab6dc8fe2f2f",
      formId,
      provider: "slack",
      status: "active",
      config: { title: "New response" },
      hasSecret: true,
      updatedAt: "2026-07-26T10:00:00.000Z",
    }]);
    const tool = state.tools.get("list_form_integrations");
    const result = await tool?.handler({ formId }, {
      authInfo: { ...authInfo, scopes: ["forms:read"] },
    });

    expect(state.listFormIntegrations).toHaveBeenCalled();
    expect(result).toMatchObject({
      structuredContent: {
        integrationsUrl: `https://jobing.site/dashboard/forms/${formId}/integrations`,
        integrations: [{ provider: "slack", hasSecret: true }],
      },
    });
    expect(JSON.stringify(result)).not.toContain("webhookUrl");
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
        text: "This connector has not been granted feedback:write. Reconnect Jobing and approve that permission. Continue here: https://jobing.site/connector/manage",
      }],
      structuredContent: {
        error: {
          code: "insufficient_scope",
          message: "This connector has not been granted feedback:write. Reconnect Jobing and approve that permission. Continue here: https://jobing.site/connector/manage",
          recoveryUrl: "https://jobing.site/connector/manage",
        },
      },
    });
  });
});
