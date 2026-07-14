import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { requireConnectorActor } from "@/lib/connector-auth";
import { createConnectedNote, deployConnectedPage } from "@/lib/connected-tools";
import { buildConnectorFormDraft, createFormDraftToolInputSchema } from "@/lib/form-tool";
import {
  createConnectorForm,
  listConnectorForms,
  publishConnectorForm,
} from "@/lib/forms-service";
import { consumeConnectorRateLimit, validateAccessTokenInfo } from "@/lib/oauth";
import { effectiveOAuthScopes } from "@/lib/oauth-scopes";
import { rateLimit, requestIp } from "@/lib/rate-limit";

function toolError(error: unknown, fallback: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: error instanceof Error ? error.message : fallback }],
  };
}

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
      async ({ id, content }, { authInfo }) => {
        try {
          const actor = requireConnectorActor(authInfo, "notes:write");
          const note = await createConnectedNote(actor.userId, id, content);
          return {
            content: [{ type: "text", text: `Created note "${note.id}": ${note.url}` }],
            structuredContent: note,
          };
        } catch (error) {
          return toolError(error, "Could not create the note.");
        }
      },
    );

    server.registerTool(
      "deploy_page",
      {
        title: "Deploy a Jobing page",
        description: "Deploys a new public HTML page owned by the connected user's Jobing account.",
        inputSchema: {
          id: z.string().min(1).max(64).describe("Short URL ID using letters, numbers, hyphens, or underscores."),
          html: z.string().min(1).max(500_000).describe("A complete HTML document or HTML fragment to deploy."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, html }, { authInfo }) => {
        try {
          const actor = requireConnectorActor(authInfo, "pages:write");
          const page = await deployConnectedPage(actor.userId, id, html);
          return {
            content: [{ type: "text", text: `Deployed page "${page.id}": ${page.url}` }],
            structuredContent: page,
          };
        } catch (error) {
          return toolError(error, "Could not deploy the page.");
        }
      },
    );

    server.registerTool(
      "create_form_draft",
      {
        title: "Create a Jobing form draft",
        description: "Creates a versioned form draft in the connected user's Forms workspace. Use this whenever a page needs a form.",
        inputSchema: createFormDraftToolInputSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input, { authInfo }) => {
        try {
          const actor = requireConnectorActor(authInfo, "forms:write");
          const form = await createConnectorForm(actor, buildConnectorFormDraft(input), input.operationId);
          return {
            content: [{ type: "text", text: `Created form draft "${form.name}" (${form.id}), revision ${form.revision}.` }],
            structuredContent: form,
          };
        } catch (error) {
          return toolError(error, "Could not create the form draft.");
        }
      },
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
      async (_, { authInfo }) => {
        try {
          const actor = requireConnectorActor(authInfo, "forms:read");
          const forms = await listConnectorForms(actor);
          return {
            content: [{ type: "text", text: forms.length ? `Found ${forms.length} form${forms.length === 1 ? "" : "s"}.` : "No forms yet." }],
            structuredContent: { forms },
          };
        } catch (error) {
          return toolError(error, "Could not list forms.");
        }
      },
    );

    server.registerTool(
      "publish_form",
      {
        title: "Publish a Jobing form",
        description: "Publishes an immutable version of an existing form draft after an explicit user request.",
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
      async ({ formId, expectedRevision, operationId }, { authInfo }) => {
        try {
          const actor = requireConnectorActor(authInfo, "forms:publish");
          const form = await publishConnectorForm(actor, formId, expectedRevision, operationId);
          return {
            content: [{ type: "text", text: `Published form version ${form.version}. Hosted form and submission endpoint: ${form.endpointUrl}. Use the returned HTML contract to wire it into the page.` }],
            structuredContent: form,
          };
        } catch (error) {
          return toolError(error, "Could not publish the form.");
        }
      },
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

function securedHandler(req: Request) {
  // Coarse pre-authentication abuse protection only. The authoritative limit
  // runs after token validation in a distributed per-grant Supabase bucket.
  if (!rateLimit(`mcp:${requestIp(req)}`, 2_000, 60_000)) return new Response("Too many requests", { status: 429 });
  return authHandler(req);
}
export { securedHandler as GET, securedHandler as POST };
