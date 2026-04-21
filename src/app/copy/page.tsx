import { Metadata } from "next";
import CopyClient from "@/app/c/[id]/CopyClient";

export const metadata: Metadata = {
  title: "Online Notepad & Clipboard | Share Text Instantly - Jobing AI",
  description: "A radically fast, free online notepad. Instantly save, edit, and share text across devices with custom short URLs. No login or installation required. Built for speed.",
  keywords: ["online notepad", "share text", "paste text online", "online clipboard", "stealth notes app", "Jobing AI notes", "free text sharing tool"],
  openGraph: {
    title: "Online Notepad & Clipboard | Share Text Instantly",
    description: "A fast, free online notepad. Instantly save, edit, and share text across devices with custom short URLs. No login required.",
    url: "https://jobing.site/copy",
    siteName: "Jobing AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Online Notepad & Clipboard | Jobing AI",
    description: "Instantly share and save text online for free without logging in.",
  }
};

export const dynamic = "force-dynamic";

function generateRandomId(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CopyRootPage() {
  const randomId = generateRandomId();
  return <CopyClient id={randomId} initialContent="" isNew={true} />;
}