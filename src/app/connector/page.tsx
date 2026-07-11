import type { Metadata } from "next";
import { ConnectorPageClient } from "./ConnectorPageClient";

export const metadata: Metadata = {
  title: "Connect Jobing to ChatGPT, Claude & MCP Clients",
  description: "Create notes and deploy pages from ChatGPT, Claude, Cursor, Gemini, and any AI tool that supports remote MCP connectors.",
  alternates: { canonical: "/connector" },
  openGraph: {
    title: "Give your AI a place to do things | Jobing Connector",
    description: "One secure MCP connection for creating notes and deploying pages from your AI tool.",
    url: "https://jobing.site/connector",
  },
};

export default function ConnectorPage() {
  return <ConnectorPageClient />;
}
