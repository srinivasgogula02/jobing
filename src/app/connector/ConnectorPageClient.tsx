"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Copy, FileText, Globe2, Lock, Sparkles } from "lucide-react";

const CONNECTOR_URL = "https://jobing.site/mcp";

const apps = [
  { name: "ChatGPT", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
  { name: "Claude", icon: "https://cdn.simpleicons.org/claude/D97757" },
  { name: "Gemini", icon: "https://cdn.simpleicons.org/googlegemini/4285F4" },
  { name: "Cursor", icon: "https://cdn.simpleicons.org/cursor/111111" },
];

function ConnectorUrl({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(CONNECTOR_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`flex w-full items-center gap-2 rounded-xl border border-[#d9ddd3] bg-white p-2 shadow-[0_8px_30px_rgba(18,25,16,.07)] ${compact ? "max-w-xl" : "max-w-[620px]"}`}>
      <code className="min-w-0 flex-1 truncate px-2 font-mono text-[12px] font-medium text-[#343a32] sm:px-3 sm:text-sm">{CONNECTOR_URL}</code>
      <button onClick={copy} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-[#151914] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#293025] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] sm:px-4" aria-label={`Copy ${CONNECTOR_URL}`}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export function ConnectorPageClient() {
  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#151914] selection:bg-[#c1ff00] selection:text-[#151914]">
      <header className="border-b border-[#e1e4dc] bg-[#f7f8f4]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Jobing AI home">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px]" priority />
            <span className="text-base font-bold tracking-[-0.025em]">Jobing AI</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#how" className="hidden text-[#62695f] hover:text-[#151914] sm:block">How it works</a>
            <a href="#connect" className="inline-flex min-h-11 items-center rounded-lg bg-[#151914] px-4 text-white hover:bg-[#293025]">Connect Jobing AI</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#dce1d6] bg-white px-3 py-1.5 text-xs font-semibold text-[#596153] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#87b000]" /> Works with ChatGPT, Claude, Gemini and more
        </div>
        <h1 className="mx-auto mt-7 max-w-[900px] text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[.95] tracking-[-0.068em]">
          Your AI can now<br className="hidden sm:block" /> publish things for you.
        </h1>
        <p className="mx-auto mt-7 max-w-[690px] text-[17px] leading-7 text-[#656c62] sm:text-xl sm:leading-8">
          Save a conversation as a shareable note or turn an idea into a live web page—without leaving the AI app you already use.
        </p>
        <div id="connect" className="mx-auto mt-9 flex max-w-[620px] scroll-mt-24 flex-col items-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.1em] text-[#747b70]">Copy this connector link</p>
          <ConnectorUrl />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[#7a8176]"><Lock size={12} /> You will sign in securely on Jobing AI</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="overflow-hidden rounded-[24px] border border-[#d9ddd3] bg-white shadow-[0_30px_90px_rgba(32,42,25,.12)]">
          <div className="flex items-center gap-2 border-b border-[#e4e7df] bg-[#fafbf8] px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2a5a0]" /><span className="h-2.5 w-2.5 rounded-full bg-[#e5cf84]" /><span className="h-2.5 w-2.5 rounded-full bg-[#9bc998]" />
            <span className="ml-3 text-xs font-medium text-[#858c81]">From an idea to a live page</span>
          </div>
          <div className="grid lg:grid-cols-[1fr_72px_1fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef0eb]"><img src={apps[0].icon} alt="ChatGPT logo" className="h-6 w-6" /></span><div><p className="text-sm font-bold">ChatGPT</p><p className="text-xs text-[#858c81]">Jobing AI is connected</p></div></div>
              <div className="mt-8 ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-[#eff1ec] px-4 py-3.5 text-sm leading-6 text-[#343a32]">Create a simple event page for our design meetup on 18 July in Hyderabad, then publish it.</div>
              <div className="mt-5 max-w-[92%] rounded-2xl rounded-bl-md border border-[#dfe3da] px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold text-[#678800]"><Sparkles size={14} /> Jobing AI is publishing your page</p>
                <div className="mt-4 space-y-3"><div className="h-2 w-full rounded-full bg-[#edf0e9] motion-safe:animate-pulse" /><div className="h-2 w-3/4 rounded-full bg-[#edf0e9] motion-safe:animate-pulse" /></div>
              </div>
            </div>

            <div className="relative hidden items-center justify-center border-x border-[#e4e7df] bg-[#fafbf8] lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c1ff00] shadow-[0_8px_24px_rgba(126,167,0,.2)]"><ChevronRight size={20} /></div>
            </div>

            <div className="border-t border-[#e4e7df] bg-[#f4f6f0] p-5 sm:p-8 lg:border-t-0 lg:p-10">
              <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#71796e]">Published page</p><span className="flex items-center gap-1.5 text-xs font-semibold text-[#608000]"><Check size={13} /> Live</span></div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#d7dcd2] bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#eceee9] bg-[#fafbf8] px-3 py-2.5"><Globe2 size={13} className="text-[#7b8277]" /><span className="truncate font-mono text-[10px] text-[#697065]">jobing.site/pages/hyderabad-design-meetup</span></div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[.13em] text-[#718d19]">Hyderabad · 18 July</p>
                  <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-.045em]">Designing products people understand.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#6e756b]">An evening for designers, builders, and curious minds. Talks, demos, and good conversations.</p>
                  <span className="mt-6 inline-flex rounded-lg bg-[#151914] px-4 py-2.5 text-xs font-semibold text-white">Save my seat</span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#343a32]"><CheckCircle2 size={17} className="text-[#719500]" /> Your AI sends this live link back to you</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e0e4dc] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-[#646b61]">Connect Jobing AI to</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:items-center sm:gap-10">
            {apps.map((app) => <div key={app.name} className="flex items-center gap-2.5"><img src={app.icon} alt={`${app.name} logo`} className="h-7 w-7 object-contain" /><span className="text-sm font-bold">{app.name}</span></div>)}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1180px] scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
        <div className="text-center"><p className="text-sm font-bold text-[#668500]">Simple setup</p><h2 className="mt-3 text-3xl font-bold tracking-[-.045em] sm:text-5xl">Connect once. Then just ask.</h2><p className="mx-auto mt-4 max-w-xl text-[#6e756b]">No coding and no API keys. It takes a few minutes.</p></div>
        <ol className="mx-auto mt-12 grid max-w-[1000px] gap-5 md:grid-cols-3">
          {[{ t: "Open your AI settings", d: "Look for Apps, Connectors, or Integrations." }, { t: "Paste the Jobing AI link", d: `Add ${CONNECTOR_URL} as a connector.` }, { t: "Sign in and approve", d: "Return to your AI and start asking it to create things." }].map((item, index) => <li key={item.t} className="rounded-2xl border border-[#dfe3da] bg-white p-6 shadow-[0_10px_30px_rgba(31,40,25,.05)]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c1ff00] text-sm font-bold">{index + 1}</span><h3 className="mt-6 text-xl font-bold">{item.t}</h3><p className="mt-3 leading-6 text-[#6f766c]">{item.d}</p></li>)}
        </ol>
      </section>

      <section className="bg-[#151914] text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div><p className="text-sm font-bold text-[#c1ff00]">Useful from day one</p><h2 className="mt-4 text-3xl font-bold tracking-[-.045em] sm:text-4xl">Two things your AI can do right now.</h2><p className="mt-4 leading-7 text-[#aeb5aa]">More Jobing AI tools will appear automatically after they launch.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-[#20261f] p-6"><FileText className="text-[#c1ff00]" size={23} /><h3 className="mt-6 text-xl font-bold">Save a note</h3><p className="mt-3 leading-6 text-[#aeb5aa]">Turn any answer, summary, checklist, or draft into a clean link you can share.</p><p className="mt-6 text-sm font-semibold text-white">“Save this as a note.”</p></article>
              <article className="rounded-2xl bg-[#20261f] p-6"><Globe2 className="text-[#c1ff00]" size={23} /><h3 className="mt-6 text-xl font-bold">Publish a page</h3><p className="mt-3 leading-6 text-[#aeb5aa]">Turn generated HTML into a live web page for an event, project, or idea.</p><p className="mt-6 text-sm font-semibold text-white">“Publish this as a page.”</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div><p className="text-sm font-bold text-[#668500]">Secure by design</p><h2 className="mt-4 text-3xl font-bold tracking-[-.045em] sm:text-4xl">Your password stays private.</h2><p className="mt-4 max-w-xl leading-7 text-[#6e756b]">You sign in directly on Jobing AI. Your AI app receives permission to use the tools you approve—not your password. You can disconnect whenever you want.</p></div>
        <ul className="grid gap-3 text-sm font-semibold text-[#353b33] sm:grid-cols-2">{["No API key needed", "Approve access yourself", "Disconnect anytime", "New tools appear automatically"].map(item => <li key={item} className="flex items-center gap-3 rounded-xl border border-[#dfe3da] bg-white p-4"><CheckCircle2 size={18} className="shrink-0 text-[#719500]" />{item}</li>)}</ul>
      </section>

      <section className="border-t border-[#e0e4dc] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-bold tracking-[-.04em]">Give your AI a way to finish the job.</h2><p className="mt-3 text-[#6e756b]">Copy the visible link below and add it to your AI app.</p></div>
          <ConnectorUrl compact />
        </div>
      </section>

      <footer className="border-t border-[#e4e7df]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-8 text-xs text-[#737a70] sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-2.5"><Image src="/logo.png" alt="" width={22} height={22} className="h-5 w-5 rounded-[5px]" /><span>Jobing AI · 2026</span></div><div className="flex gap-5"><Link href="/privacy" className="hover:text-black">Privacy</Link><Link href="/terms" className="hover:text-black">Terms</Link><a href="mailto:hello@jobing.site" className="hover:text-black">Support</a></div></div>
      </footer>
    </main>
  );
}
