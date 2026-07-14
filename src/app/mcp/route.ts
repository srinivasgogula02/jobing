import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createConnectedNote, deployConnectedPage } from "@/lib/connected-tools";
import { runConnectorTool } from "@/lib/connector-tool-runtime";
import { buildConnectorFormDraft, createFormDraftToolInputSchema } from "@/lib/form-tool";
import { connectorFeedbackInputSchema, reportConnectorFeedback } from "@/lib/connector-feedback";
import { pageIdSchema } from "@/lib/page-id-schema";
import {
  createConnectorForm,
  listConnectorForms,
  publishConnectorForm,
} from "@/lib/forms-service";
import { consumeConnectorRateLimit, validateAccessTokenInfo } from "@/lib/oauth";
import { effectiveOAuthScopes } from "@/lib/oauth-scopes";
import { captureProductEvent } from "@/lib/product-telemetry";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_note",
      {
        title: "Create a Jobing note",
        description: "Creates a new shareable text note in the connected user's Jobing account.",
        inputSchema: {
          id: z.string().min(1).max(64).describe("Short URL ID using letters, numbers, hyphens, or underscores."),
          content: z.string().min(1).max(100_000).describe("The text to store in the note."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, content }, { authInfo }) => runConnectorTool({
        toolName: "create_note",
        authInfo,
        requiredScope: "notes:write",
        fallback: "Could not create the note.",
        execute: async (actor) => {
          const note = await createConnectedNote(actor.userId, id, content);
          return {
            content: [{ type: "text", text: `Created note "${note.id}": ${note.url}` }],
            structuredContent: note,
          };
        },
      }),
    );

    server.registerTool(
      "deploy_page",
      {
        title: "Deploy a Jobing page",
        description: "Deploys a new public HTML page owned by the connected user's Jobing account.",
        inputSchema: {
          id: pageIdSchema,
          html: z.string().min(1).max(500_000).describe("A complete HTML document or HTML fragment to deploy."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ id, html }, { authInfo }) => runConnectorTool({
        toolName: "deploy_page",
        authInfo,
        requiredScope: "pages:write",
        fallback: "Could not deploy the page.",
        execute: async (actor) => {
          const page = await deployConnectedPage(actor.userId, id, html);
          return {
            content: [{ type: "text", text: `Deployed page "${page.id}": ${page.url}` }],
            structuredContent: page,
          };
        },
      }),
    );

    server.registerTool(
      "create_form_draft",
      {
        title: "Create a Jobing form draft",
        description: "Creates a versioned form draft and a native HTML form template. Use this whenever a page needs a form. Never embed Jobing Forms in an iframe; place the returned form markup directly in the page and customize its HTML/CSS.",
        inputSchema: createFormDraftToolInputSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input, { authInfo }) => runConnectorTool({
        toolName: "create_form_draft",
        authInfo,
        requiredScope: "forms:write",
        fallback: "Could not create the form draft.",
        execute: async (actor) => {
          const form = await createConnectorForm(actor, buildConnectorFormDraft(input), input.operationId);
          return {
            content: [{ type: "text", text: `Created form draft "${form.name}" (${form.id}), revision ${form.revision}. It has no public URL until it is published.` }],
            structuredContent: form,
          };
        },
      }),
    );

    server.registerTool(
      "list_forms",
      {
        title: "List Jobing forms",
        description: "Lists form definitions and publishing status. It never reads form responses.",
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (_, { authInfo }) => runConnectorTool({
        toolName: "list_forms",
        authInfo,
        requiredScope: "forms:read",
        fallback: "Could not list forms.",
        execute: async (actor) => {
          const forms = await listConnectorForms(actor);
          return {
            content: [{ type: "text", text: forms.length ? `Found ${forms.length} form${forms.length === 1 ? "" : "s"}.` : "No forms yet." }],
            structuredContent: { forms },
          };
        },
      }),
    );

    server.registerTool(
      "publish_form",
      {
        title: "Publish a Jobing form",
        description: "Publishes an immutable form and returns its API action plus complete native HTML. Put that HTML directly in the custom page. Never use an iframe for a Jobing form.",
        inputSchema: {
          formId: z.string().uuid(),
          expectedRevision: z.number().int().positive().describe("Draft revision returned by create_form_draft or list_forms."),
          operationId: z.string().min(8).max(200).optional().describe("Stable idempotency key. Reuse it when retrying the same publish."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ formId, expectedRevision, operationId }, { authInfo }) => runConnectorTool({
        toolName: "publish_form",
        authInfo,
        requiredScope: "forms:publish",
        fallback: "Could not publish the form.",
        execute: async (actor) => {
          const form = await publishConnectorForm(actor, formId, expectedRevision, operationId);
          return {
            content: [{ type: "text", text: `Published form version ${form.version}. Submission endpoint: ${form.endpointUrl}. Use the returned native HTML directly in the page and customize it there. Do not use an iframe.` }],
            structuredContent: form,
          };
        },
      }),
    );

    server.registerTool(
      "report_connector_feedback",
      {
        title: "Send feedback to Jobing",
        description: "Sends a short product-feedback report after the user explicitly asks or confirms that it should be shared. Use it for missing Jobing capabilities, bugs, or workflow friction. Never include prompts, conversation transcripts, HTML, URLs, contact details, form responses, credentials, secrets, or other personal data.",
        inputSchema: connectorFeedbackInputSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input, { authInfo }) => runConnectorTool({
        toolName: "report_connector_feedback",
        authInfo,
        requiredScope: "feedback:write",
        fallback: "Feedback could not be saved right now.",
        execute: async (actor) => {
          const feedback = await reportConnectorFeedback(actor, input);
          return {
            content: [{ type: "text", text: `Product feedback sent to Jobing. Reference: ${feedback.id}.` }],
            structuredContent: {
              feedbackId: feedback.id,
              duplicate: feedback.duplicate,
            },
          };
        },
      }),
    );
  },
  {},
  { basePath: "", maxDuration: 60 },
);

async function grantRateLimitedHandler(req: Request) {
  const grantId = req.auth?.extra?.grantId;
  if (typeof grantId !== "string") {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (!(await consumeConnectorRateLimit(grantId))) {
    return new Response(JSON.stringify({ error: "rate_limit_exceeded" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": "60",
      },
    });
  }
  return handler(req);
}

const authHandler = withMcpAuth(
  grantRateLimitedHandler,
  async (_, token) => {
    const info = await validateAccessTokenInfo(token);
    if (!info || !token) return undefined;
    return {
      token,
      clientId: info.clientId,
      scopes: effectiveOAuthScopes(info.scope),
      expiresAt: info.expiresAt,
      extra: { userId: info.userId, grantId: info.grantId },
    };
  },
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  },
);

async function securedHandler(req: Request) {
  const startedAt = performance.now();
  // Coarse pre-authentication abuse protection only. The authoritative limit
  // runs after token validation in a distributed per-grant Supabase bucket.
  if (!rateLimit(`mcp:${requestIp(req)}`, 2_000, 60_000)) {
    captureProductEvent({ event: "mcp_request_completed", properties: { outcome: "error", error_code: "preauth_rate_limited", status: "429", duration_ms: Math.round(performance.now() - startedAt) } });
    return new Response("Too many requests", { status: 429 });
  }
  const response = await authHandler(req);
  // Successful transport requests are sampled because MCP clients can poll;
  // every error is retained. Tool completions above remain exact.
  if (response.status >= 400 || Math.random() < 0.1) {
    captureProductEvent({
      event: "mcp_request_completed",
      properties: {
        outcome: response.status < 400 ? "success" : "error",
        status: String(response.status),
        ...(response.status >= 400 ? { error_code: response.status === 401 ? "unauthorized" : response.status === 429 ? "rate_limited" : "transport_error" } : {}),
        duration_ms: Math.round(performance.now() - startedAt),
      },
    });
  }
  return response;
}
export { securedHandler as GET, securedHandler as POST };
