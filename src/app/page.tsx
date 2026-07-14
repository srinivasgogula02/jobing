import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "Jobing AI | Give your AI the tools to finish the work",
  description: "Connect Jobing AI to any MCP-compatible AI. Publish websites, create forms, collect leads, and follow up by email from one conversation.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Your AI can now finish the work",
    description: "One MCP connector for live pages, custom forms, lead collection, and email follow-up.",
    url: "https://jobing.site",
  },
};

export default function Home() {
  return <HomePageClient />;
}
