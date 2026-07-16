import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import {
  createConnectedNote,
  deleteConnectedPage,
  deployConnectedPage,
  getConnectedPage,
  listConnectedPages,
  updateConnectedPage,
} from "@/lib/connected-tools";
import { runConnectorTool } from "@/lib/connector-tool-runtime";
import {
  buildConnectorFormDraft,
  buildUpdatedConnectorFormDraft,
  createFormDraftToolInputSchema,
  updateFormDraftToolInputSchema,
} from "@/lib/form-tool";
import { connectorFeedbackInputSchema, reportConnectorFeedback } from "@/lib/connector-feedback";
import { pageIdSchema } from "@/lib/page-id-schema";
import {
  createConnectorForm,
  duplicateConnectorForm,
  FormsServiceError,
  getFormFromService,
  listConnectorForms,
  listConnectorFormResponses,
  publishConnectorForm,
  setConnectorFormResponseState,
  updateConnectorForm,
  type ConnectorFormDefinition,
} from "@/lib/forms-service";
import { authorizeMcpRequest } from "@/lib/oauth";
import { effectiveOAuthScopes } from "@/lib/oauth-scopes";
import { captureProductEvent } from "@/lib/product-telemetry";
import { classifyConnectorClient, countBucket, payloadSizeBucket } from "@/lib/product-analytics-contract";
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
        properties: {
          page_contains_form: /<form\b/i.test(html),
          payload_size_bucket: payloadSizeBucket(html.length),
        },
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
      "list_pages",
      {
        title: "List Jobing pages",
        description: "Lists up to 200 of the connected user's most recently updated public pages. Use this before reading or changing an existing page.",
        inputSchema: {},
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (_, { authInfo }) => runConnectorTool({
        toolName: "list_pages",
        authInfo,
        requiredScope: "pages:read",
        fallback: "Could not list the pages.",
        execute: async (actor) => {
          const pages = await listConnectedPages(actor.userId);
          return {
            content: [{
              type: "text",
              text: pages.length === 200
                ? "Found the 200 most recently updated pages."
                : pages.length
                  ? `Found ${pages.length} page${pages.length === 1 ? "" : "s"}.`
                  : "No pages yet.",
            }],
            structuredContent: { pages },
          };
        },
        resultProperties: (result) => ({ result_count_bucket: countBucket(result.structuredContent.pages.length) }),
      }),
    );

    server.registerTool(
      "get_page",
      {
        title: "Read a Jobing page",
        description: "Returns the current HTML and public URL for one page owned by the connected user. Read the page before editing it.",
        inputSchema: { id: pageIdSchema },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ id }, { authInfo }) => runConnectorTool({
        toolName: "get_page",
        authInfo,
        requiredScope: "pages:read",
        fallback: "Could not read the page.",
        execute: async (actor) => {
          const page = await getConnectedPage(actor.userId, id);
          return { content: [{ type: "text", text: `Loaded page "${page.id}".` }], structuredContent: page };
        },
      }),
    );

    server.registerTool(
      "update_page",
      {
        title: "Update a Jobing page",
        description: "Replaces the HTML of an existing page owned by the connected user while keeping the same public URL. Use get_page first and preserve anything the user did not ask to change.",
        inputSchema: {
          id: pageIdSchema,
          html: z.string().min(1).max(500_000).describe("The complete replacement HTML document or fragment."),
          expectedUpdatedAt: z.string().datetime({ offset: true }).describe("The exact updatedAt value returned by get_page. This prevents overwriting a newer edit."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async ({ id, html, expectedUpdatedAt }, { authInfo }) => runConnectorTool({
        toolName: "update_page",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not update the page.",
        properties: {
          page_contains_form: /<form\b/i.test(html),
          payload_size_bucket: payloadSizeBucket(html.length),
        },
        execute: async (actor) => {
          const page = await updateConnectedPage(actor.userId, id, html, expectedUpdatedAt);
          return { content: [{ type: "text", text: `Updated page "${page.id}": ${page.url}` }], structuredContent: page };
        },
      }),
    );

    server.registerTool(
      "delete_page",
      {
        title: "Delete a Jobing page",
        description: "Permanently deletes an existing page. Call this only after the user explicitly asks to delete that page and confirms the exact page ID.",
        inputSchema: {
          id: pageIdSchema,
          confirmed: z.literal(true).describe("Must be true only after the user explicitly confirms permanent deletion of this exact page."),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      },
      async ({ id }, { authInfo }) => runConnectorTool({
        toolName: "delete_page",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not delete the page.",
        execute: async (actor) => {
          const result = await deleteConnectedPage(actor.userId, id);
          return { content: [{ type: "text", text: `Deleted page "${result.id}".` }], structuredContent: result };
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
        properties: {
          field_count_bucket: countBucket(input.fields.length),
          has_file_upload: input.fields.some((field) => field.type === "file"),
          resource_status: "draft",
        },
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
        resultProperties: (result) => ({ result_count_bucket: countBucket(result.structuredContent.forms.length) }),
      }),
    );

    server.registerTool(
      "update_form_draft",
      {
        title: "Edit a Jobing form draft",
        description: "Updates a form's versioned draft while preserving all existing submissions and the currently published version. Use list_forms first, send the complete desired field list, then publish the returned revision only if the user wants the changes live.",
        inputSchema: updateFormDraftToolInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input, { authInfo }) => runConnectorTool({
        toolName: "update_form_draft",
        authInfo,
        requiredScope: ["forms:read", "forms:write"],
        fallback: "Could not update the form draft.",
        properties: {
          field_count_bucket: countBucket(input.fields.length),
          has_file_upload: input.fields.some((field) => field.type === "file"),
          resource_status: "draft",
        },
        execute: async (actor) => {
          const current = await getFormFromService(actor, input.formId).catch((error) => {
            if (error instanceof FormsServiceError && error.code === "form_not_found") return null;
            throw error;
          });
          if (!current?.definition) throw new FormsServiceError("form_not_found", "The requested form could not be found.", 404);
          const desired = buildUpdatedConnectorFormDraft(input, {
            name: current.name,
            definition: current.definition as ConnectorFormDefinition,
          });
          const form = await updateConnectorForm(actor, input.formId, {
            expectedRevision: input.expectedRevision,
            name: desired.name,
            description: desired.description,
            definition: desired.definition,
          });
          return {
            content: [{ type: "text", text: `Saved draft revision ${form.revision} for "${form.name}". Existing responses and the current live version are unchanged. Publish revision ${form.revision} to make these edits live.` }],
            structuredContent: form,
          };
        },
      }),
    );

    server.registerTool(
      "duplicate_form",
      {
        title: "Duplicate a Jobing form",
        description: "Creates an unpublished copy of an existing form definition. Responses stay attached only to the original form.",
        inputSchema: {
          sourceFormId: z.string().uuid(),
          name: z.string().trim().min(1).max(200).describe("Dashboard name for the copy."),
          operationId: z.string().min(8).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._~:/-]*$/).describe("Stable idempotency key. Reuse it when retrying this duplication."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ sourceFormId, name, operationId }, { authInfo }) => runConnectorTool({
        toolName: "duplicate_form",
        authInfo,
        requiredScope: ["forms:read", "forms:write"],
        fallback: "Could not duplicate the form.",
        properties: { resource_status: "draft" },
        execute: async (actor) => {
          const form = await duplicateConnectorForm(actor, sourceFormId, name, operationId);
          return {
            content: [{ type: "text", text: `Created unpublished form copy "${form.name}" (${form.id}), revision ${form.revision}.` }],
            structuredContent: form,
          };
        },
      }),
    );

    server.registerTool(
      "list_form_responses",
      {
        title: "Read Jobing form responses",
        description: "Lists and searches submitted answers for one form. Use the returned answers to summarize leads or applicants only when the user asks. Private uploaded file contents are never returned; only file metadata is included.",
        inputSchema: {
          formId: z.string().uuid(),
          query: z.string().trim().max(200).optional().describe("Optional text search across submitted answers."),
          state: z.enum(["inbox", "spam", "archived"]).default("inbox"),
          sort: z.enum(["newest", "oldest"]).default("newest"),
          page: z.number().int().min(1).max(100_000).default(1),
          pageSize: z.number().int().min(1).max(20).default(20),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ formId, query, state, sort, page, pageSize }, { authInfo }) => runConnectorTool({
        toolName: "list_form_responses",
        authInfo,
        requiredScope: "forms.responses:read",
        fallback: "Could not read the form responses.",
        properties: {
          query_used: Boolean(query),
          response_state: state,
        },
        execute: async (actor) => {
          const responses = await listConnectorFormResponses(actor, formId, { query, state, sort, page, pageSize });
          const lockedNotice = responses.hiddenTotal > 0
            ? ` ${responses.hiddenTotal} additional response${responses.hiddenTotal === 1 ? " is" : "s are"} saved securely but outside this plan's viewing allowance. Upgrade at https://jobing.site/pricing?reason=response_limit to unlock them.`
            : "";
          return {
            content: [{ type: "text", text: `Found ${responses.total} visible ${state} response${responses.total === 1 ? "" : "s"}. Showing page ${responses.page} of ${responses.pages}.${lockedNotice}` }],
            structuredContent: {
              ...responses,
              ...(responses.hiddenTotal > 0 ? { upgradeUrl: "https://jobing.site/pricing?reason=response_limit" } : {}),
            },
          };
        },
        resultProperties: (result) => ({
          result_count_bucket: countBucket(result.structuredContent.items.length),
          has_hidden_results: result.structuredContent.hiddenTotal > 0,
          plan_key: result.structuredContent.planKey,
        }),
      }),
    );

    server.registerTool(
      "set_form_response_state",
      {
        title: "Organize a Jobing form response",
        description: "Moves one response between inbox, spam, and archived. This is reversible and does not delete the response.",
        inputSchema: {
          submissionId: z.string().uuid(),
          state: z.enum(["inbox", "spam", "archived"]),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ submissionId, state }, { authInfo }) => runConnectorTool({
        toolName: "set_form_response_state",
        authInfo,
        requiredScope: "forms.responses:write",
        fallback: "Could not organize the form response.",
        properties: { response_state: state },
        execute: async (actor) => {
          const result = await setConnectorFormResponseState(actor, submissionId, state);
          return {
            content: [{ type: "text", text: `Moved response ${result.submissionId} to ${result.state}.` }],
            structuredContent: result,
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
        properties: { resource_status: "published" },
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
        properties: {
          feedback_kind: input.kind,
          use_case: input.useCase,
        },
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

  if (req.auth?.extra?.rateLimitAllowed !== true) {
    const userId = req.auth?.extra?.userId;
    const clientType = req.auth?.extra?.clientType;
    captureProductEvent({
      event: "mcp_request_completed",
      distinctId: typeof userId === "string" ? userId : undefined,
      properties: {
        outcome: "error",
        error_code: "grant_rate_limited",
        status: "429",
        client_type: typeof clientType === "string" ? clientType : "other",
        product_area: "connector",
      },
    });
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
    const info = await authorizeMcpRequest(token);
    if (!info || !token) return undefined;
    const clientType = classifyConnectorClient(info.redirectUris);
    return {
      token,
      clientId: info.clientId,
      scopes: effectiveOAuthScopes(info.scope),
      expiresAt: info.expiresAt,
      extra: { userId: info.userId, grantId: info.grantId, clientType, rateLimitAllowed: info.rateLimitAllowed },
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
