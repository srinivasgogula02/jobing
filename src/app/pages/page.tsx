import { Metadata } from "next";
import HtmlViewerClient from "./HtmlViewerClient";

export const metadata: Metadata = {
  title: "Jobing Pages — Deploy HTML Instantly | Jobing AI",
  description: "Write or paste HTML code and deploy it to a live public URL with one click. Free, fast, no login required.",
  keywords: ["deploy HTML", "HTML hosting", "free HTML page", "instant deploy", "Jobing Pages"],
  openGraph: {
    title: "Jobing Pages — Deploy HTML Instantly",
    description: "Write or paste HTML code and deploy it to a live public URL with one click. Free, fast, no login required.",
    url: "https://jobing.site/pages",
    siteName: "Jobing AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Jobing Pages | Jobing AI",
    description: "Deploy HTML pages to a live public URL instantly. No login required.",
  },
};

export const dynamic = "force-dynamic";

function generateRandomId(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function PagesRootPage() {
  const randomId = generateRandomId();
  return <HtmlViewerClient id={randomId} initialHtml="" isNew={true} />;
}
