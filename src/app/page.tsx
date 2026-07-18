import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "Jobing AI | Give your AI the tools to finish the work",
  description: "Connect Jobing AI to a compatible AI app. Publish web pages, create custom forms, collect responses, and work with those responses from one conversation.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Your AI can now finish the work",
    description: "One connector for live web pages, custom forms, response collection, and AI-assisted response work.",
    url: "https://jobing.site",
  },
};

export default function Home() {
  return <HomePageClient />;
}
