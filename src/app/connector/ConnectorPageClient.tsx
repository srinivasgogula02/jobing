"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Copy, FileText, Globe2, LockKeyhole, Sparkles } from "lucide-react";

const MCP_URL = "https://jobing.site/mcp";

const apps = [
  { name: "ChatGPT", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
  { name: "Claude", icon: "https://cdn.simpleicons.org/claude/D97757" },
  { name: "Gemini", icon: "https://cdn.simpleicons.org/googlegemini/8AB4F8" },
  { name: "Cursor", icon: "https://cdn.simpleicons.org/cursor/FFFFFF" },
];

const setup = [
  { title: "Open your AI app", text: "Go to its Apps, Connectors, or Integrations settings." },
  { title: "Add Jobing AI", text: "Choose Add connector and paste the Jobing AI link." },
  { title: "Sign in and approve", text: "Log in to Jobing AI once. Then you can use it in any conversation." },
];

export function ConnectorPageClient() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[#0e1219] text-[#f2f4f7] selection:bg-[#c6f24e] selection:text-[#0e1219]">
      <header className="border-b border-[#262d3a]">
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Jobing AI home">
            <Image src="/logo.png" alt="" width={34} height={34} className="h-8 w-8 rounded-lg" priority />
            <span className="text-[15px] font-semibold">Jobing AI</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <a href="#how-it-works" className="hidden text-[#9aa2af] hover:text-white sm:block">How it works</a>
            <Link href="/tools" className="inline-flex min-h-11 items-center rounded-lg bg-[#c6f24e] px-4 font-semibold text-[#0e1219] hover:bg-[#d4fa6e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6f24e]">Try Jobing AI</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1120px] gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16">
        <div>
          <p className="mb-5 text-sm font-semibold text-[#c6f24e]">Jobing AI for your favorite AI app</p>
          <h1 className="max-w-[680px] text-[clamp(2.7rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
            Turn an AI answer into a real link.
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-7 text-[#a4acb9] sm:text-lg">
            Ask ChatGPT, Claude, or another AI to save a note or publish a web page. Jobing AI does it for you and sends the finished link back to the chat.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={copyLink} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#c6f24e] px-5 font-semibold text-[#0e1219] hover:bg-[#d4fa6e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Connector link copied" : "Copy connector link"}
            </button>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#3a4351] px-5 font-semibold hover:bg-[#161b25]">See how it works <ArrowRight size={17} /></a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-[#7e8794]"><LockKeyhole size={13} /> Free to connect · Sign in securely · Disconnect anytime</p>
        </div>

        <div className="relative rounded-[24px] border border-[#343d4b] bg-[#171d27] p-4 shadow-[0_30px_90px_rgba(0,0,0,.32)] sm:p-5" aria-label="Example conversation using Jobing AI">
          <div className="flex items-center justify-between border-b border-[#303846] pb-4">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><img src={apps[0].icon} alt="ChatGPT logo" className="h-6 w-6" /></span><div><p className="text-sm font-semibold">ChatGPT</p><p className="text-[11px] text-[#7f8997]">Jobing AI connected</p></div></div>
            <span className="flex items-center gap-1.5 text-[11px] text-[#71d6a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#71d6a5]" /> Ready</span>
          </div>
          <div className="space-y-4 py-5">
            <div className="ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-[#2a3240] px-4 py-3 text-sm leading-6 text-[#eef0f3]">Save these meeting notes and give me a link I can share with the team.</div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[#303846] bg-[#111620] px-4 py-3.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#c6f24e]"><Sparkles size={14} /> Using Jobing AI</p>
              <p className="mt-2 text-sm leading-6 text-[#cbd0d8]">Done — I created your note.</p>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#394250] bg-[#171d27] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2"><FileText size={16} className="shrink-0 text-[#c6f24e]" /><span className="truncate text-xs text-[#aeb5c0]">jobing.site/c/team-meeting</span></div>
                <span className="ml-3 text-xs font-semibold text-[#c6f24e]">Open</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#303846] bg-[#10151d] px-4 py-3 text-sm text-[#697382]">Ask anything…</div>
        </div>
      </section>

      <section className="border-y border-[#262d3a] bg-[#111620]">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[220px_1fr] md:items-center">
          <p className="text-sm font-medium text-[#8d96a4]">Use Jobing AI inside</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {apps.map((app) => <div key={app.name} className="flex items-center gap-3 rounded-xl border border-[#303846] bg-[#171d27] px-4 py-3.5"><img src={app.icon} alt={`${app.name} logo`} className="h-6 w-6 object-contain" /><span className="text-sm font-semibold">{app.name}</span></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#c6f24e]">What you can do today</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">From conversation to something you can use.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-[#303846] bg-[#151b25] p-7 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c6f24e]/10 text-[#c6f24e]"><FileText size={21} /></span>
            <h3 className="mt-6 text-2xl font-semibold">Create a shareable note</h3>
            <p className="mt-3 leading-7 text-[#939caa]">Save summaries, checklists, ideas, meeting notes, or any useful AI response. Share the link with anyone.</p>
            <p className="mt-6 rounded-xl bg-[#0f141c] px-4 py-3 text-sm text-[#c5cad2]">Try saying: “Save this as a note.”</p>
          </article>
          <article className="rounded-2xl border border-[#303846] bg-[#151b25] p-7 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c6f24e]/10 text-[#c6f24e]"><Globe2 size={21} /></span>
            <h3 className="mt-6 text-2xl font-semibold">Publish a web page</h3>
            <p className="mt-3 leading-7 text-[#939caa]">Turn AI-generated HTML into a live page for a project, announcement, prototype, or simple website.</p>
            <p className="mt-6 rounded-xl bg-[#0f141c] px-4 py-3 text-sm text-[#c5cad2]">Try saying: “Publish this as a page.”</p>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#262d3a] bg-[#f5f6f2] text-[#15181d]">
        <div className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-[#647c18]">Set it up once</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Three steps. Then just ask.</h2><p className="mt-4 text-[#626870]">You do not need to understand APIs or write code.</p></div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {setup.map((item, index) => <li key={item.title} className="border-t border-[#cfd2ca] pt-6"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15181d] text-sm font-semibold text-white">{index + 1}</span><h3 className="mt-6 text-xl font-semibold">{item.title}</h3><p className="mt-3 leading-7 text-[#656b72]">{item.text}</p></li>)}
          </ol>
          <div className="mt-12 rounded-2xl border border-[#d4d7cf] bg-white p-4 sm:flex sm:items-center sm:gap-4 sm:p-5">
            <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#777d72]">Connector link</p><code className="mt-1 block truncate text-sm text-[#252a2f]">{MCP_URL}</code></div>
            <button onClick={copyLink} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#15181d] px-4 text-sm font-semibold text-white hover:bg-black sm:mt-0 sm:w-auto">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}</button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1fr]">
        <div><p className="text-sm font-semibold text-[#c6f24e]">Safe and in your control</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Your AI never sees your password.</h2><p className="mt-4 max-w-lg leading-7 text-[#939caa]">You sign in directly on Jobing AI and choose whether to allow access. You can disconnect at any time from your AI app.</p></div>
        <ul className="space-y-4 text-sm text-[#c7ccd4]">
          {["Secure sign-in on Jobing AI", "No personal API key to create or paste", "Only the actions you approve", "New Jobing AI tools become available automatically"].map((item) => <li key={item} className="flex items-center gap-3 border-b border-[#2b323e] pb-4"><CheckCircle2 size={18} className="shrink-0 text-[#71d6a5]" />{item}</li>)}
        </ul>
      </section>

      <section className="border-t border-[#262d3a] bg-[#111620]">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-semibold tracking-[-0.04em]">Ready to make your AI useful?</h2><p className="mt-3 text-[#8e97a5]">Copy the link, add Jobing AI, and ask it to create something.</p></div>
          <button onClick={copyLink} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#c6f24e] px-5 font-semibold text-[#0e1219] hover:bg-[#d4fa6e]">{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Connector link copied" : "Copy connector link"}</button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1120px] flex-col gap-5 px-5 py-8 text-xs text-[#6f7886] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5"><Image src="/logo.png" alt="" width={22} height={22} className="h-5 w-5 rounded-[5px]" /><span>Jobing AI · 2026</span></div>
        <div className="flex gap-5"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><a href="mailto:hello@jobing.site" className="hover:text-white">Support</a></div>
      </footer>
    </main>
  );
}
