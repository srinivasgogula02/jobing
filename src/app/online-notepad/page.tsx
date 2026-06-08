import { Metadata } from "next";
import { Zap, Link2, Smartphone, Lock, Save, Search } from "lucide-react";
import ToolLanding, { type ToolLandingConfig } from "@/components/ToolLanding";

export const metadata: Metadata = {
  title: "Online Notepad — Free, Fast, No Login | Jobing AI",
  description:
    "A free online notepad that loads instantly. Write, save and share notes from any device with a custom short link. No account, no install, no clutter.",
  keywords: [
    "online notepad",
    "notepad online",
    "ai notepad online",
    "free online notepad",
    "notepad with clipboard",
    "online notepad share",
    "downloadable notepad",
    "online note pad",
  ],
  alternates: { canonical: "/online-notepad" },
  openGraph: {
    title: "Online Notepad — Free, Fast, No Login",
    description:
      "Write, save and share notes from any device with a custom short link. No account required.",
    url: "https://jobing.site/online-notepad",
    siteName: "Jobing AI",
    type: "website",
  },
};

const config: ToolLandingConfig = {
  path: "/online-notepad",
  appName: "Jobing Online Notepad",
  badge: "Online Notepad",
  h1: "The fastest online notepad on the web",
  lede:
    "Open a blank page, start typing, and your note is ready to save or share in seconds. No sign-up, no setup — just a clean, distraction-free notepad that works on any device.",
  ctaPrimaryLabel: "Open the Notepad",
  intro: [
    "Jobing's online notepad is built for one thing: getting text out of your head and onto a page as fast as possible. There's no onboarding, no account wall, and no cookie banner fighting for your attention. You land on a blank canvas and you write — meeting notes, a to-do list, code you're about to paste somewhere else, or a draft you don't want to lose.",
    "Every note can become a shareable short link like jobing.site/c/my-notes. That makes it a notepad you can actually pass to someone — a classmate, a teammate, or just your own phone. Unlike a desktop text file, a Jobing note is reachable from any browser, anywhere, without emailing yourself or installing an app.",
    "If you've been searching for an online notepad with a built-in clipboard, share links, and a genuinely fast editor, this is it. It's free, and it stays out of your way.",
  ],
  features: [
    { icon: Zap, title: "Instant load", body: "The editor is the page. No splash screens, no spinners — start typing the moment it opens." },
    { icon: Link2, title: "Custom short links", body: "Rename any note to a memorable URL like /c/homework so you and others can find it again." },
    { icon: Smartphone, title: "Works everywhere", body: "Phone, tablet, laptop, library computer. If it has a browser, your notepad is one link away." },
    { icon: Save, title: "Save when you want", body: "Nothing auto-saves until you hit share, so you can use it as a private scratchpad first." },
    { icon: Lock, title: "Private stealth links", body: "Swap /c/ for /p/ to share a note behind a low-key page only the right people will open." },
    { icon: Search, title: "No account, no tracking clutter", body: "No login to write a note. Just open, type, and go." },
  ],
  steps: [
    { title: "Open the notepad", body: "Head to the editor — a clean, full-screen page is ready instantly." },
    { title: "Write or paste your text", body: "Type a note or paste up to 100,000 characters. Use it as a scratchpad as long as you like." },
    { title: "Save and share", body: "Hit Create Share to get a link. Optionally rename it to a custom short URL you'll remember." },
  ],
  faqs: [
    { q: "Is the online notepad free?", a: "Yes. Writing, saving and sharing notes is completely free, with no account required." },
    { q: "Do I need to create an account?", a: "No. You can open the notepad and start writing immediately. Accounts are only needed for Jobing's career tools, not the notepad." },
    { q: "Can I access my note from another device?", a: "Yes. Once you save a note it lives at a short link (like jobing.site/c/your-id) that you can open from any browser on any device." },
    { q: "Is there a built-in clipboard?", a: "Yes — you can copy the note's contents or its link with one tap, which makes it a fast online clipboard for moving text between devices." },
    { q: "How much text can a note hold?", a: "Each note holds up to 100,000 characters, which is plenty for long documents, code, or study material." },
    { q: "Can I keep a note private?", a: "You can use the private 'stealth' link by swapping /c/ for /p/, which opens a low-key page that only people you share it with will think to open." },
  ],
  related: [
    { href: "/online-clipboard", label: "Online Clipboard", desc: "Move text between your phone and laptop with one link." },
    { href: "/share-text", label: "Share Text Online", desc: "Turn any block of text into a shareable short URL." },
    { href: "/tools", label: "All Free Tools", desc: "Resume builder, HTML viewer and more." },
  ],
};

export default function OnlineNotepadPage() {
  return <ToolLanding config={config} />;
}
