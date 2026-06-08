import { Metadata } from "next";
import { Link2, Send, Smartphone, Lock, Zap, Pencil } from "lucide-react";
import ToolLanding, { type ToolLandingConfig } from "@/components/ToolLanding";

export const metadata: Metadata = {
  title: "Share Text Online — Instant Link for Any Text | Jobing AI",
  description:
    "Share text online in seconds. Paste anything, get a short link, and send it to any device or person. Free, no login, no app — the fastest way to share text.",
  keywords: [
    "share text",
    "share text online",
    "sharetext",
    "paste text online",
    "online share text",
    "text share online",
    "share notepad",
    "notepad share online",
  ],
  alternates: { canonical: "/share-text" },
  openGraph: {
    title: "Share Text Online — Instant Link for Any Text",
    description:
      "Paste anything, get a short link, and send it anywhere. Free, no login, no app.",
    url: "https://jobing.site/share-text",
    siteName: "Jobing AI",
    type: "website",
  },
};

const config: ToolLandingConfig = {
  path: "/share-text",
  appName: "Jobing Share Text",
  badge: "Share Text",
  h1: "Share text online in one link",
  lede:
    "Paste any text, hit share, and you get a short link you can send to anyone or open on any device. No login, no app, no friction — the simplest way to move text from A to B.",
  ctaPrimaryLabel: "Share Text Now",
  intro: [
    "Sometimes you just need to get a block of text to someone — or to your other device — without the overhead of a doc, a chat app, or an email. Jobing lets you share text online by turning it into a clean short link like jobing.site/c/notes. Paste, share, done.",
    "The link is editable and reusable. Update the text and the same link reflects it, so you can share a living note instead of a frozen copy. Give it a custom name so it's easy to remember and easy to read aloud.",
    "It's also a notepad and an online clipboard, which means you can write the text here, copy it out anywhere, or hand the link to a friend. Free, instant, and refreshingly free of clutter.",
  ],
  features: [
    { icon: Send, title: "Instant share link", body: "Paste your text and get a short URL in one tap — ready to send over any chat or email." },
    { icon: Pencil, title: "Editable & reusable", body: "Update the note and the same link stays current. Share a living document, not a frozen copy." },
    { icon: Link2, title: "Memorable custom URLs", body: "Rename your link to something like /c/wifi or /c/recipe so it's easy to share verbally." },
    { icon: Smartphone, title: "Any device, any browser", body: "The person you send it to needs nothing installed — it opens right in their browser." },
    { icon: Lock, title: "Low-key private links", body: "Prefer discretion? Share a /p/ stealth link instead of a public one." },
    { icon: Zap, title: "No login, no wait", body: "No account to share text, and the editor opens instantly. Up to 100,000 characters per note." },
  ],
  steps: [
    { title: "Paste your text", body: "Open the editor and drop in whatever you want to share — notes, a snippet, a list." },
    { title: "Create the link", body: "Hit Create Share to get a short URL. Rename it to a custom slug if you want it memorable." },
    { title: "Send it", body: "Copy the link and share it anywhere. Anyone who opens it sees your text instantly." },
  ],
  faqs: [
    { q: "How do I share text online for free?", a: "Open the Jobing editor, paste your text, and hit Create Share. You'll get a free short link you can send to anyone — no account needed." },
    { q: "Does the person I share with need an account?", a: "No. They just open the link in any browser and see the text. They can copy it with one tap." },
    { q: "Can I edit the text after sharing the link?", a: "Yes. The link is reusable — edit the note and the same URL reflects your changes." },
    { q: "Can I choose a custom link name?", a: "Yes. You can rename any note to a memorable slug like jobing.site/c/my-text." },
    { q: "Is there a limit on how much text I can share?", a: "Each note supports up to 100,000 characters, enough for long documents, transcripts or code." },
    { q: "Can I share text privately?", a: "Yes — use the /p/ stealth link, which opens a discreet page instead of a public note." },
  ],
  related: [
    { href: "/online-notepad", label: "Online Notepad", desc: "A fast, free notepad with custom share links." },
    { href: "/online-clipboard", label: "Online Clipboard", desc: "Copy on one device, paste on another." },
    { href: "/tools", label: "All Free Tools", desc: "Resume builder, HTML viewer and more." },
  ],
};

export default function ShareTextPage() {
  return <ToolLanding config={config} />;
}
