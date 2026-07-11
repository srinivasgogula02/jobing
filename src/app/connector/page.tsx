import type { Metadata } from "next";
import { ConnectorPageClient } from "./ConnectorPageClient";

export const metadata: Metadata = {
  title: "Connect Jobing AI to ChatGPT, Claude & MCP Clients",
  description: "Create notes and deploy pages with Jobing AI from ChatGPT, Claude, Cursor, Gemini, and any AI tool that supports remote MCP connectors.",
  alternates: { canonical: "/connector" },
  openGraph: {
    title: "Let your AI finish the work | Jobing AI Connector",
    description: "One secure MCP connection for creating notes and deploying pages from your AI tool.",
    url: "https://jobing.site/connector",
  },
};

export default function ConnectorPage() {
  return <ConnectorPageClient />;
}
