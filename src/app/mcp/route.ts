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
import { instrumentJobingMcpServer } from "@/lib/mcp-analytics";
import {
  buildConnectorFormDraft,
  buildUpdatedConnectorFormDraft,
  createFormDraftToolInputSchema,
  updateFormDraftToolInputSchema,
} from "@/lib/form-tool";
import { connectorFeedbackInputSchema, reportConnectorFeedback } from "@/lib/connector-feedback";
import { pageIdSchema } from "@/lib/page-id-schema";
import { getPageEntitlement } from "@/lib/page-entitlements";
import {
  createConnectorForm,
  duplicateConnectorForm,
  FormsServiceError,
  getFormFromService,
  listConnectorFormIntegrations,
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
import { classifyConnectorClient, countBucket, MCP_USE_CASES, payloadSizeBucket } from "@/lib/product-analytics-contract";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { connectorDestinations, formNavigation, noteNavigation, pageNavigation } from "@/lib/connector-navigation";
import {
  addPageDomain,
  listPageDomains,
  refreshPageDomain,
  removePageDomain,
  setPageCustomAddress,
} from "@/lib/page-domain-service";

const mcpUseCaseSchema = z.enum(MCP_USE_CASES).describe("Closest non-sensitive category for what the user is trying to accomplish. Choose other only when none fit. Never put names, contact details, prompts, or form answers here.");

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_note",
      {
        title: "Create a Jobing note",
        description: "Creates a new shareable text note in the connected user's Jobing account. Surface the returned note URL to the user.",
        inputSchema: {
          id: z.string().min(1).max(64).describe("Short URL ID using letters, numbers, hyphens, or underscores."),
          content: z.string().min(1).max(100_000).describe("The text to store in the note."),
          useCase: mcpUseCaseSchema,
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, content, useCase }, { authInfo }) => runConnectorTool({
        toolName: "create_note",
        authInfo,
        requiredScope: "notes:write",
        fallback: "Could not create the note.",
        properties: { use_case: useCase },
        execute: async (actor) => {
          const note = await createConnectedNote(actor.userId, id, content);
          const result = { ...note, ...noteNavigation(note.url) };
          return {
            content: [{ type: "text", text: `Created note "${note.id}". Open it: ${note.url}` }],
            structuredContent: result,
          };
        },
      }),
    );

    server.registerTool(
      "deploy_page",
      {
        title: "Deploy a Jobing page",
        description: "Deploys a new public HTML page owned by the connected user's Jobing account. After success, surface the returned live, edit, and Pages dashboard URLs to the user.",
        inputSchema: {
          id: pageIdSchema,
          html: z.string().min(1).max(500_000).describe("A complete HTML document or HTML fragment to deploy."),
          useCase: mcpUseCaseSchema,
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ id, html, useCase }, { authInfo }) => runConnectorTool({
        toolName: "deploy_page",
        authInfo,
        requiredScope: "pages:write",
        fallback: "Could not deploy the page.",
        properties: {
          use_case: useCase,
          page_contains_form: /<form\b/i.test(html),
          payload_size_bucket: payloadSizeBucket(html.length),
        },
        execute: async (actor) => {
          const page = await deployConnectedPage(actor.userId, id, html);
          const result = { ...page, ...pageNavigation(page.id, page.url) };
          return {
            content: [{ type: "text", text: `Deployed page "${page.id}"${page.pageCount ? ` (${page.pageCount} of ${page.pageLimit} pages used)` : ""}.\nLive page: ${page.url}\nEdit page: ${result.editUrl}\nAll pages: ${result.pagesDashboardUrl}` }],
            structuredContent: result,
          };
        },
      }),
    );

    server.registerTool(
      "list_pages",
      {
        title: "List Jobing pages",
        description: "Lists up to 200 of the connected user's most recently updated public pages. Use this before reading or changing an existing page. Surface the Pages dashboard URL when useful.",
        inputSchema: {},
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (_, { authInfo }) => runConnectorTool({
        toolName: "list_pages",
        authInfo,
        requiredScope: "pages:read",
        fallback: "Could not list the pages.",
        execute: async (actor) => {
          const [pages, entitlement] = await Promise.all([listConnectedPages(actor.userId), getPageEntitlement(actor.userId)]);
          const linkedPages = pages.map((page) => ({ ...page, ...pageNavigation(page.id, page.url, false) }));
          const remaining = Math.max(0, entitlement.pageLimit - pages.length);
          return {
            content: [{
              type: "text",
              text: pages.length === 200
                ? `Found the 200 most recently updated pages. Open all pages: ${connectorDestinations.pagesDashboardUrl}`
                : pages.length
                  ? `Found ${pages.length} page${pages.length === 1 ? "" : "s"}; ${remaining} can still be created on the ${entitlement.planName} plan. Open all pages: ${connectorDestinations.pagesDashboardUrl}`
                  : `No pages yet. This plan includes ${entitlement.pageLimit}. Open the Pages dashboard: ${connectorDestinations.pagesDashboardUrl}`,
            }],
            structuredContent: { pages: linkedPages, pagesDashboardUrl: connectorDestinations.pagesDashboardUrl, planName: entitlement.planName, pageLimit: entitlement.pageLimit, remaining },
          };
        },
        resultProperties: (result) => ({ result_count_bucket: countBucket(result.structuredContent.pages.length) }),
      }),
    );

    server.registerTool(
      "get_page",
      {
        title: "Read a Jobing page",
        description: "Returns the current HTML, public URL, editor URL, and Pages dashboard URL for one page owned by the connected user. Read the page before editing it.",
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
          const result = { ...page, ...pageNavigation(page.id, page.url) };
          return { content: [{ type: "text", text: `Loaded page "${page.id}".\nLive page: ${page.url}\nEdit page: ${result.editUrl}\nAll pages: ${result.pagesDashboardUrl}` }], structuredContent: result };
        },
      }),
    );

    server.registerTool(
      "update_page",
      {
        title: "Update a Jobing page",
        description: "Replaces the HTML of an existing page owned by the connected user while keeping the same public URL. Use get_page first and preserve anything the user did not ask to change. Surface the returned live, edit, and Pages dashboard URLs.",
        inputSchema: {
          id: pageIdSchema,
          html: z.string().min(1).max(500_000).describe("The complete replacement HTML document or fragment."),
          expectedUpdatedAt: z.string().datetime({ offset: true }).describe("The exact updatedAt value returned by get_page. This prevents overwriting a newer edit."),
          useCase: mcpUseCaseSchema,
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async ({ id, html, expectedUpdatedAt, useCase }, { authInfo }) => runConnectorTool({
        toolName: "update_page",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not update the page.",
        properties: {
          use_case: useCase,
          page_contains_form: /<form\b/i.test(html),
          payload_size_bucket: payloadSizeBucket(html.length),
        },
        execute: async (actor) => {
          const page = await updateConnectedPage(actor.userId, id, html, expectedUpdatedAt);
          const result = { ...page, ...pageNavigation(page.id, page.url) };
          return { content: [{ type: "text", text: `Updated page "${page.id}".\nLive page: ${page.url}\nEdit page: ${result.editUrl}\nAll pages: ${result.pagesDashboardUrl}` }], structuredContent: result };
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
          return { content: [{ type: "text", text: `Deleted page "${result.id}". Open your remaining pages: ${connectorDestinations.pagesDashboardUrl}` }], structuredContent: { ...result, pagesDashboardUrl: connectorDestinations.pagesDashboardUrl, nextActions: [{ label: "Open all pages", url: connectorDestinations.pagesDashboardUrl }] } };
        },
      }),
    );

    server.registerTool(
      "list_page_domains",
      {
        title: "List page domains",
        description: "Lists the connected user's custom page domains, verification state, and required DNS records. Use this before assigning a page to a custom domain. Surface the domains dashboard URL.",
        inputSchema: {},
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (_, { authInfo }) => runConnectorTool({
        toolName: "list_page_domains",
        authInfo,
        requiredScope: "pages:read",
        fallback: "Could not list page domains.",
        execute: async (actor) => {
          const domains = await listPageDomains(actor.userId);
          const safeDomains = domains.map(({ id, hostname, status, is_default, dns_records }) => ({
            id,
            hostname,
            status,
            isDefault: is_default,
            dnsRecords: dns_records,
          }));
          return {
            content: [{ type: "text", text: `${domains.length ? `Found ${domains.length} custom domain${domains.length === 1 ? "" : "s"}.` : "No custom domains are connected."} Manage domains: ${connectorDestinations.pageDomainsUrl}` }],
            structuredContent: { domains: safeDomains, domainsDashboardUrl: connectorDestinations.pageDomainsUrl },
          };
        },
        resultProperties: (result) => ({ result_count_bucket: countBucket(result.structuredContent.domains.length) }),
      }),
    );

    server.registerTool(
      "add_page_domain",
      {
        title: "Add a custom page domain",
        description: "Starts connecting a domain the user owns and returns the exact DNS records they must add. It cannot edit DNS for the user. After calling it, clearly surface the domains dashboard URL and explain that the domain stays offline until verification succeeds.",
        inputSchema: { domain: z.string().trim().min(4).max(253).describe("Domain owned by the user, such as example.com or pages.example.com. Do not include a page path.") },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      },
      async ({ domain }, { authInfo }) => runConnectorTool({
        toolName: "add_page_domain",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not add the custom domain.",
        execute: async (actor) => {
          const added = await addPageDomain(actor.userId, domain);
          const domains = await listPageDomains(actor.userId);
          const current = domains.find((entry) => entry.id === added.domainId);
          return {
            content: [{ type: "text", text: `Added ${added.hostname}. It will not serve pages until its DNS records are added and verified. Continue here: ${added.domainsDashboardUrl}` }],
            structuredContent: { ...added, status: current?.status ?? "pending", dnsRecords: current?.dns_records ?? [], nextActions: [{ label: "Finish domain setup", url: added.domainsDashboardUrl }] },
          };
        },
      }),
    );

    server.registerTool(
      "verify_page_domain",
      {
        title: "Check a page domain",
        description: "Checks whether the user's DNS records and HTTPS setup are ready. Use list_page_domains first to get the domain ID.",
        inputSchema: { domainId: z.string().uuid() },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      },
      async ({ domainId }, { authInfo }) => runConnectorTool({
        toolName: "verify_page_domain",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not check the custom domain.",
        execute: async (actor) => {
          const result = await refreshPageDomain(actor.userId, domainId);
          return {
            content: [{ type: "text", text: result.ready ? `${result.hostname} is verified and ready.` : `${result.hostname} is still waiting for DNS. Review the required records: ${connectorDestinations.pageDomainsUrl}` }],
            structuredContent: { ...result, domainsDashboardUrl: connectorDestinations.pageDomainsUrl },
          };
        },
      }),
    );

    server.registerTool(
      "set_page_address",
      {
        title: "Set a page's custom address",
        description: "Assigns an owned page to one of the user's custom domains and sets its editable path. Use list_pages and list_page_domains first. A page remains available at its Jobing URL while domain verification is pending.",
        inputSchema: {
          pageId: pageIdSchema,
          domainId: z.string().uuid().nullable().describe("Custom domain ID, or null to remove the custom-domain assignment."),
          path: pageIdSchema.describe("Editable path after the domain, for example contact in example.com/contact."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ pageId, domainId, path }, { authInfo }) => runConnectorTool({
        toolName: "set_page_address",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not change the page address.",
        execute: async (actor) => {
          const result = await setPageCustomAddress(actor.userId, pageId, domainId, path);
          const fallbackUrl = pageNavigation(result.pageId).editUrl;
          return {
            content: [{ type: "text", text: result.customUrl ? `${result.customUrl} was assigned${result.ready ? " and is live" : ", but it will stay pending until DNS is verified"}. Edit the page: ${fallbackUrl}` : `Removed the custom-domain assignment. The Jobing page URL still works. Edit the page: ${fallbackUrl}` }],
            structuredContent: { ...result, editUrl: fallbackUrl, pagesDashboardUrl: connectorDestinations.pagesDashboardUrl },
          };
        },
      }),
    );

    server.registerTool(
      "remove_page_domain",
      {
        title: "Remove a custom page domain",
        description: "Disconnects a custom domain from Jobing. Call only after the user explicitly confirms the exact domain. Jobing-hosted page URLs remain available.",
        inputSchema: { domainId: z.string().uuid(), confirmed: z.literal(true).describe("True only after the user confirms permanent disconnection of this exact domain.") },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      },
      async ({ domainId }, { authInfo }) => runConnectorTool({
        toolName: "remove_page_domain",
        authInfo,
        requiredScope: "pages:manage",
        fallback: "Could not remove the custom domain.",
        execute: async (actor) => {
          const result = await removePageDomain(actor.userId, domainId);
          return { content: [{ type: "text", text: `Removed ${result.hostname}. Jobing-hosted page links continue to work. Manage pages: ${connectorDestinations.pagesDashboardUrl}` }], structuredContent: { ...result, pagesDashboardUrl: connectorDestinations.pagesDashboardUrl } };
        },
      }),
    );

    server.registerTool(
      "create_form_draft",
      {
        title: "Create a Jobing form draft",
        description: "Creates a versioned form draft and a native HTML form template. Use this whenever a page needs a form. Supports conditional questions, ratings, yes/no, response schedules and caps, progress, uploads, and custom success behavior. Never embed Jobing Forms in an iframe; place the returned form markup directly in the page and customize its HTML/CSS. After success, surface the returned edit and Forms dashboard URLs to the user.",
        inputSchema: createFormDraftToolInputSchema.and(z.object({ useCase: mcpUseCaseSchema })),
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
          use_case: input.useCase,
          field_count_bucket: countBucket(input.fields.length),
          has_file_upload: input.fields.some((field) => field.type === "file"),
          has_conditional_logic: input.fields.some((field) => Boolean(field.condition)),
          has_response_controls: Boolean(input.behavior),
          resource_status: "draft",
        },
        execute: async (actor) => {
          const form = await createConnectorForm(actor, buildConnectorFormDraft(input), input.operationId);
          const navigation = formNavigation(form.id);
          const result = { ...form, ...navigation };
          return {
            content: [{ type: "text", text: `Created form draft "${form.name}" (${form.id}), revision ${form.revision}. It has no public URL until it is published.\nEdit form: ${navigation.editUrl}\nAll forms: ${navigation.formsDashboardUrl}` }],
            structuredContent: result,
          };
        },
      }),
    );

    server.registerTool(
      "list_forms",
      {
        title: "List Jobing forms",
        description: "Lists form definitions, publishing status, and dashboard destinations. It never reads form responses. Surface the Forms dashboard URL when useful.",
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
          const linkedForms = forms.map((form) => ({
            ...form,
            ...formNavigation(form.id, "endpointUrl" in form ? form.endpointUrl : undefined, false),
          }));
          return {
            content: [{ type: "text", text: `${forms.length ? `Found ${forms.length} form${forms.length === 1 ? "" : "s"}.` : "No forms yet."} Open all forms: ${connectorDestinations.formsDashboardUrl}` }],
            structuredContent: { forms: linkedForms, formsDashboardUrl: connectorDestinations.formsDashboardUrl },
          };
        },
        resultProperties: (result) => ({ result_count_bucket: countBucket(result.structuredContent.forms.length) }),
      }),
    );

    server.registerTool(
      "list_form_integrations",
      {
        title: "List integrations for a Jobing form",
        description: "Lists which apps are connected to one form and returns the secure dashboard URL for setup. Use this when the user asks about Slack, Google Sheets, Airtable, Notion, HubSpot, Mailchimp, Google Drive, Email, Telegram, Lark, Zapier, Webhooks, Google Analytics, or Meta Pixel. Never ask the user to paste integration credentials into chat; direct them to the returned integrations URL.",
        inputSchema: {
          formId: z.string().uuid().describe("The form ID returned by create_form_draft or list_forms."),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ formId }, { authInfo }) => runConnectorTool({
        toolName: "list_form_integrations",
        authInfo,
        requiredScope: "forms:read",
        fallback: "Could not list the form integrations.",
        execute: async (actor) => {
          const integrations = await listConnectorFormIntegrations(actor, formId);
          const navigation = formNavigation(formId);
          const summary = integrations.length
            ? `${integrations.length} integration${integrations.length === 1 ? " is" : "s are"} connected.`
            : "No integrations are connected yet.";
          return {
            content: [{
              type: "text",
              text: `${summary} Connect or manage apps securely: ${navigation.integrationsUrl}. Do not send credentials through chat.`,
            }],
            structuredContent: {
              integrations,
              integrationsUrl: navigation.integrationsUrl,
              formsDashboardUrl: navigation.formsDashboardUrl,
              nextActions: [
                { label: "Connect or manage apps", url: navigation.integrationsUrl },
                { label: "Open all forms", url: navigation.formsDashboardUrl },
              ],
            },
          };
        },
        resultProperties: (result) => ({
          result_count_bucket: countBucket(result.structuredContent.integrations.length),
        }),
      }),
    );

    server.registerTool(
      "update_form_draft",
      {
        title: "Edit a Jobing form draft",
        description: "Updates questions, conditional rules, design, response schedule/cap, progress, and success behavior in a versioned draft while preserving all existing submissions and the currently published version. Use list_forms first, send the complete desired field list, then publish the returned revision only if the user wants the changes live.",
        inputSchema: updateFormDraftToolInputSchema.and(z.object({ useCase: mcpUseCaseSchema })),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input, { authInfo }) => runConnectorTool({
        toolName: "update_form_draft",
        authInfo,
        requiredScope: ["forms:read", "forms:write"],
        fallback: "Could not update the form draft.",
        properties: {
          use_case: input.useCase,
          field_count_bucket: countBucket(input.fields.length),
          has_file_upload: input.fields.some((field) => field.type === "file"),
          has_conditional_logic: input.fields.some((field) => Boolean(field.condition)),
          has_response_controls: Boolean(input.behavior),
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
          const navigation = formNavigation(form.id, "endpointUrl" in form ? form.endpointUrl : undefined);
          return {
            content: [{ type: "text", text: `Saved draft revision ${form.revision} for "${form.name}". Existing responses and the current live version are unchanged. Publish revision ${form.revision} to make these edits live.\nEdit form: ${navigation.editUrl}\nView responses: ${navigation.responsesUrl}\nAll forms: ${navigation.formsDashboardUrl}` }],
            structuredContent: { ...form, ...navigation },
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
          useCase: mcpUseCaseSchema,
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ sourceFormId, name, operationId, useCase }, { authInfo }) => runConnectorTool({
        toolName: "duplicate_form",
        authInfo,
        requiredScope: ["forms:read", "forms:write"],
        fallback: "Could not duplicate the form.",
        properties: { resource_status: "draft", use_case: useCase },
        execute: async (actor) => {
          const form = await duplicateConnectorForm(actor, sourceFormId, name, operationId);
          const navigation = formNavigation(form.id);
          return {
            content: [{ type: "text", text: `Created unpublished form copy "${form.name}" (${form.id}), revision ${form.revision}.\nEdit form: ${navigation.editUrl}\nAll forms: ${navigation.formsDashboardUrl}` }],
            structuredContent: { ...form, ...navigation },
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
          useCase: mcpUseCaseSchema,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ formId, query, state, sort, page, pageSize, useCase }, { authInfo }) => runConnectorTool({
        toolName: "list_form_responses",
        authInfo,
        requiredScope: "forms.responses:read",
        fallback: "Could not read the form responses.",
        properties: {
          use_case: useCase,
          query_used: Boolean(query),
          response_state: state,
        },
        execute: async (actor) => {
          const responses = await listConnectorFormResponses(actor, formId, { query, state, sort, page, pageSize });
          const navigation = formNavigation(formId);
          const lockedNotice = responses.hiddenTotal > 0
            ? ` ${responses.hiddenTotal} additional response${responses.hiddenTotal === 1 ? " is" : "s are"} saved securely but outside this plan's viewing allowance. Upgrade at https://jobing.site/pricing?reason=response_limit to unlock them.`
            : "";
          return {
            content: [{ type: "text", text: `Found ${responses.total} visible ${state} response${responses.total === 1 ? "" : "s"}. Showing page ${responses.page} of ${responses.pages}. Responses dashboard: ${navigation.responsesUrl}${lockedNotice}` }],
            structuredContent: {
              ...responses,
              ...navigation,
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
            content: [{ type: "text", text: `Moved response ${result.submissionId} to ${result.state}. Open your forms inbox: ${connectorDestinations.formsDashboardUrl}` }],
            structuredContent: { ...result, formsDashboardUrl: connectorDestinations.formsDashboardUrl, nextActions: [{ label: "Open forms inbox", url: connectorDestinations.formsDashboardUrl }] },
          };
        },
      }),
    );

    server.registerTool(
      "publish_form",
      {
        title: "Publish a Jobing form",
        description: "Publishes an immutable form and returns its API action, complete native HTML, live form URL, responses URL, editor URL, share URL, and Forms dashboard URL. Put that HTML directly in the custom page. Never use an iframe for a Jobing form. Surface the useful URLs to the user.",
        inputSchema: {
          formId: z.string().uuid(),
          expectedRevision: z.number().int().positive().describe("Draft revision returned by create_form_draft or list_forms."),
          operationId: z.string().min(8).max(200).optional().describe("Stable idempotency key. Reuse it when retrying the same publish."),
          useCase: mcpUseCaseSchema,
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ formId, expectedRevision, operationId, useCase }, { authInfo }) => runConnectorTool({
        toolName: "publish_form",
        authInfo,
        requiredScope: "forms:publish",
        fallback: "Could not publish the form.",
        properties: { resource_status: "published", use_case: useCase },
        execute: async (actor) => {
          const form = await publishConnectorForm(actor, formId, expectedRevision, operationId);
          const navigation = formNavigation(form.id, form.endpointUrl);
          return {
            content: [{ type: "text", text: `Published form version ${form.version}. Use the returned native HTML directly in the page and customize it there. Do not use an iframe.\nLive form: ${form.endpointUrl}\nView responses: ${navigation.responsesUrl}\nEdit form: ${navigation.editUrl}\nAll forms: ${navigation.formsDashboardUrl}` }],
            structuredContent: { ...form, ...navigation },
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

    instrumentJobingMcpServer(server);
  },
  {
    serverInfo: {
      name: "jobing-ai",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "1.0.0",
    },
  },
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
  // every error is retained. Official $mcp_tool_call events remain exact.
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
