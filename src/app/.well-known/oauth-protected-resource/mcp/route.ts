import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/next";

const clerkHandler = protectedResourceHandlerClerk({
  scopes_supported: ["profile", "email"],
});
const corsHandler = metadataCorsOptionsRequestHandler();

async function handler(req: Request) {
  const response = clerkHandler(req);
  const metadata = await response.json();
  metadata.resource = `${new URL(req.url).origin}/mcp`;
  return Response.json(metadata, { headers: response.headers });
}

export { handler as GET, corsHandler as OPTIONS };
