import type { Metadata } from "next";
import { ConnectorPageClient } from "./ConnectorPageClient";

export const metadata: Metadata = {
  title: "Connect Jobing AI to Your AI App",
  description: "Connect Jobing AI once, then publish web pages, create custom forms, collect responses, and manage the work from your existing AI conversation.",
  alternates: { canonical: "/connector" },
  openGraph: {
    title: "Connect Jobing AI. Let your AI finish the work.",
    description: "One secure connection for publishing web pages, creating custom forms, and working with responses from your AI app.",
    url: "https://jobing.site/connector",
  },
};

export default function ConnectorPage() {
  return <ConnectorPageClient />;
}
