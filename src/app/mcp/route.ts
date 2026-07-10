import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createConnectedNote, deployConnectedPage } from "@/lib/connected-tools";
import { validateAccessToken } from "@/lib/oauth";

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
          const userId = authInfo?.extra?.userId as string | undefined;
          if (!userId) throw new Error("The connected Jobing account could not be identified.");
          const note = await createConnectedNote(userId, id, content);
          return {
            content: [{ type: "text", text: `Created note "${note.id}": ${note.url}` }],
            structuredContent: note,
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: error instanceof Error ? error.message : "Could not create the note." }],
          };
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
          const userId = authInfo?.extra?.userId as string | undefined;
          if (!userId) throw new Error("The connected Jobing account could not be identified.");
          const page = await deployConnectedPage(userId, id, html);
          return {
            content: [{ type: "text", text: `Deployed page "${page.id}": ${page.url}` }],
            structuredContent: page,
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: error instanceof Error ? error.message : "Could not deploy the page." }],
          };
        }
      },
    );
  },
  {},
  { basePath: "", maxDuration: 60 },
);

const authHandler = withMcpAuth(
  handler,
  async (_, token) => {
    const userId = await validateAccessToken(token);
    if (!userId || !token) return undefined;
    return { token, clientId: "jobing-connected-client", scopes: ["mcp"], extra: { userId } };
  },
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  },
);

export { authHandler as GET, authHandler as POST };
