import { Metadata } from "next";
import { Clipboard, Link2, Smartphone, RefreshCw, Lock, Zap } from "lucide-react";
import ToolLanding, { type ToolLandingConfig } from "@/components/ToolLanding";

export const metadata: Metadata = {
  title: "Online Clipboard — Copy & Share Text Across Devices | Jobing AI",
  description:
    "A free online clipboard to copy text on one device and paste it on another. Share your clipboard with a short link instantly — no login, no app to install.",
  keywords: [
    "online clipboard",
    "clipboard ai",
    "clipboard share",
    "share clipboard",
    "clipboard with notepad",
    "copy paste online",
    "copy to clipboard online",
    "cloud clipboard",
  ],
  alternates: { canonical: "/online-clipboard" },
  openGraph: {
    title: "Online Clipboard — Copy & Share Text Across Devices",
    description:
      "Copy on one device, paste on another. Share your clipboard with a short link instantly. No login required.",
    url: "https://jobing.site/online-clipboard",
    siteName: "Jobing AI",
    type: "website",
  },
};

const config: ToolLandingConfig = {
  path: "/online-clipboard",
  appName: "Jobing Online Clipboard",
  badge: "Online Clipboard",
  h1: "An online clipboard that follows you across devices",
  lede:
    "Copy text on your laptop and paste it on your phone — or the other way around. Jobing's online clipboard turns any block of text into a short link you can open anywhere, with no account and nothing to install.",
  ctaPrimaryLabel: "Open the Clipboard",
  intro: [
    "The hardest part of moving text between your own devices shouldn't be emailing it to yourself. Jobing's online clipboard fixes that: paste your text once, get a short link like jobing.site/c/my-clip, and open it on any other device to copy it back out. It's a cloud clipboard that works in any browser.",
    "Because each clipboard is just a URL, sharing it with someone else is the same action as saving it for yourself. Send a teammate a code snippet, drop a Wi-Fi password to a friend, or hand off a long link without making anyone retype it. One tap copies the contents; one tap copies the link.",
    "It doubles as an online notepad with a built-in clipboard, so you can edit the text before or after you copy it. No login, no ads getting in your way, and it loads instantly.",
  ],
  features: [
    { icon: Clipboard, title: "Copy & paste anywhere", body: "Paste on one device, open the link on another, and copy it straight back out." },
    { icon: RefreshCw, title: "Sync without an app", body: "No installs and no sign-in — your clipboard is just a link that works in any browser." },
    { icon: Link2, title: "One-tap share link", body: "Saving your clipboard and sharing it are the same action. Send the link and you're done." },
    { icon: Smartphone, title: "Phone ↔ laptop", body: "The classic problem — getting a URL or snippet from your computer to your phone — solved in seconds." },
    { icon: Lock, title: "Private mode", body: "Use a /p/ stealth link when your clipboard isn't meant for everyone." },
    { icon: Zap, title: "Built for speed", body: "Holds up to 100,000 characters and opens instantly, even on slow connections." },
  ],
  steps: [
    { title: "Paste your text", body: "Open the clipboard and paste whatever you need to move — a link, a snippet, a paragraph." },
    { title: "Get your link", body: "Hit Create Share to lock it to a short URL. Rename it to something memorable if you like." },
    { title: "Open it anywhere", body: "On your other device, open the link and tap Copy. The text is back on your clipboard." },
  ],
  faqs: [
    { q: "What is an online clipboard?", a: "It's a clipboard that lives on the web instead of a single device, so you can copy text in one place and paste it in another by opening a shared link." },
    { q: "Is it free to use?", a: "Yes, the online clipboard is completely free and needs no account." },
    { q: "How do I share my clipboard with someone?", a: "Save your text to get a short link, then send that link. Anyone who opens it can copy the contents with one tap." },
    { q: "Can I use it to move a link from my computer to my phone?", a: "Yes — that's one of the most common uses. Paste the link, save it, then open the short URL on your phone and copy it." },
    { q: "Does it keep a history of what I copy?", a: "Each clipboard is its own link. You control how many you create and which ones you keep or share." },
    { q: "Is there a notepad too?", a: "Yes. The clipboard and notepad are the same editor, so you can edit your text before copying or sharing it." },
  ],
  related: [
    { href: "/online-notepad", label: "Online Notepad", desc: "A fast, free notepad with custom share links." },
    { href: "/share-text", label: "Share Text Online", desc: "Turn any text into a short, shareable URL." },
    { href: "/tools", label: "All Free Tools", desc: "Resume builder, HTML viewer and more." },
  ],
};

export default function OnlineClipboardPage() {
  return <ToolLanding config={config} />;
}
