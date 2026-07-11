"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Copy, LockKeyhole } from "lucide-react";

const MCP_URL = "https://jobing.site/mcp";

const clients = [
  { name: "ChatGPT", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
  { name: "Claude", icon: "https://cdn.simpleicons.org/claude/D97757" },
  { name: "Gemini", icon: "https://cdn.simpleicons.org/googlegemini/8AB4F8" },
  { name: "Cursor", icon: "https://cdn.simpleicons.org/cursor/FFFFFF" },
];

const guides = [
  {
    client: "ChatGPT",
    where: "Settings → Apps & Connectors → Add connector",
    detail: "Choose a custom connector, paste the server URL, then continue to Jobing AI to approve access.",
  },
  {
    client: "Claude",
    where: "Settings → Connectors → Add custom connector",
    detail: "Name it Jobing AI, paste the server URL, and complete the browser sign-in when Claude opens it.",
  },
  {
    client: "Other MCP clients",
    where: "Integrations → Remote MCP server",
    detail: "Use the same endpoint with Streamable HTTP and OAuth. No client secret or personal API key is required.",
  },
];

export function ConnectorPageClient() {
  const [copied, setCopied] = useState(false);

  async function copyEndpoint() {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[#0e1219] text-[#f2f4f7] selection:bg-[#c6f24e] selection:text-[#0e1219]">
      <header className="border-b border-[#262d3a]">
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Jobing AI home">
            <Image src="/logo.png" alt="" width={34} height={34} className="h-8 w-8 rounded-[8px]" priority />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Jobing AI</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-[#9aa2af]">
            <a href="#setup" className="hidden hover:text-white sm:block">Setup</a>
            <Link href="/tools" className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#39414e] px-4 font-medium text-white hover:border-[#566170] hover:bg-[#161b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6f24e]">
              Open Jobing AI <ArrowUpRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1120px] gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-20">
        <div>
          <p className="mb-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[#c6f24e]">Jobing AI connector · MCP</p>
          <h1 className="max-w-[720px] text-[clamp(2.7rem,6vw,4.85rem)] font-medium leading-[1.01] tracking-[-0.058em]">
            Let your AI finish the work, not just describe it.
          </h1>
          <p className="mt-7 max-w-[620px] text-[17px] leading-7 text-[#9ba3b0] sm:text-lg">
            Connect Jobing AI to ChatGPT, Claude, or another MCP client. Ask it to create a shareable note or publish a working web page—and get the link back in the same conversation.
          </p>

          <div className="mt-10 max-w-[620px] border-y border-[#303744] py-5">
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-[#d5d9df]">{MCP_URL}</code>
              <button onClick={copyEndpoint} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-[#c6f24e] px-4 text-sm font-semibold text-[#0e1219] hover:bg-[#d4fa6e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy server URL"}
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <span className="text-xs text-[#727b89]">Works with</span>
            {clients.map((client) => (
              <span key={client.name} className="flex items-center gap-2 text-xs font-medium text-[#bbc1ca]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={client.icon} alt="" className="h-5 w-5 object-contain" />
                {client.name}
              </span>
            ))}
            <span className="text-xs text-[#727b89]">+ any remote MCP client</span>
          </div>
        </div>

        <aside className="border border-[#343c49] bg-[#141923] shadow-[0_28px_80px_rgba(0,0,0,.24)]" aria-label="Example connector authorization receipt">
          <div className="flex items-center justify-between border-b border-[#303744] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={26} height={26} className="h-6 w-6 rounded-md" />
              <span className="text-sm font-semibold">Jobing AI</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#71d6a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#71d6a5]" /> Connected</span>
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#727b89]">Authorization receipt</p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-[94px_1fr] gap-4"><dt className="text-[#727b89]">Account</dt><dd className="text-right text-[#d9dde3]">Your Jobing AI account</dd></div>
              <div className="grid grid-cols-[94px_1fr] gap-4"><dt className="text-[#727b89]">Protocol</dt><dd className="text-right font-mono text-xs text-[#d9dde3]">OAuth 2.1 + PKCE</dd></div>
              <div className="grid grid-cols-[94px_1fr] gap-4"><dt className="text-[#727b89]">Access</dt><dd className="text-right text-[#d9dde3]">Create notes · Deploy pages</dd></div>
            </dl>
            <div className="my-6 border-t border-dashed border-[#343c49]" />
            <div className="space-y-3 font-mono text-[11px] leading-5 text-[#8f98a6]">
              <p><span className="mr-3 text-[#71d6a5]">✓</span>Identity verified</p>
              <p><span className="mr-3 text-[#71d6a5]">✓</span>Tools discovered: 2</p>
              <p><span className="mr-3 text-[#71d6a5]">✓</span>Ready for requests</p>
            </div>
          </div>
          <div className="border-t border-[#303744] bg-[#10151d] px-5 py-3 text-center font-mono text-[10px] text-[#646d7a]">No password or API key shared with the AI client</div>
        </aside>
      </section>

      <section className="border-y border-[#262d3a] bg-[#111620]">
        <div className="mx-auto grid max-w-[1120px] divide-y divide-[#262d3a] px-5 sm:px-8 md:grid-cols-2 md:divide-x md:divide-y-0">
          <article className="py-14 md:pr-12 lg:py-16 lg:pr-20">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#727b89]">Available action 01</p>
            <h2 className="mt-5 text-2xl font-medium tracking-[-.035em]">Create a note</h2>
            <p className="mt-3 max-w-md leading-7 text-[#8f98a6]">Turn an answer, meeting summary, checklist, or draft into a shareable Jobing AI note.</p>
            <blockquote className="mt-7 border-l border-[#c6f24e] pl-4 text-sm leading-6 text-[#cbd0d8]">“Save the final launch checklist as a note and give me the link.”</blockquote>
          </article>
          <article className="py-14 md:pl-12 lg:py-16 lg:pl-20">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#727b89]">Available action 02</p>
            <h2 className="mt-5 text-2xl font-medium tracking-[-.035em]">Deploy a page</h2>
            <p className="mt-3 max-w-md leading-7 text-[#8f98a6]">Publish generated HTML as a live page and receive a public URL without changing tabs.</p>
            <blockquote className="mt-7 border-l border-[#c6f24e] pl-4 text-sm leading-6 text-[#cbd0d8]">“Deploy this project update as a page and send me the URL.”</blockquote>
          </article>
        </div>
      </section>

      <section id="setup" className="mx-auto max-w-[1120px] scroll-mt-10 px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.17em] text-[#c6f24e]">Setup guide</p>
            <h2 className="mt-5 text-3xl font-medium leading-tight tracking-[-.045em]">Add one server URL to the AI you already use.</h2>
            <p className="mt-5 text-sm leading-6 text-[#818a98]">Menu names can change between plans and client versions. The endpoint and authorization flow do not.</p>
          </div>
          <div className="border-t border-[#303744]">
            {guides.map((guide, index) => (
              <article key={guide.client} className="grid gap-4 border-b border-[#303744] py-8 sm:grid-cols-[48px_170px_1fr] sm:gap-5">
                <span className="font-mono text-xs text-[#697381]">0{index + 1}</span>
                <h3 className="font-semibold text-[#e7e9ed]">{guide.client}</h3>
                <div>
                  <p className="font-mono text-xs leading-5 text-[#c6f24e]">{guide.where}</p>
                  <p className="mt-2 text-sm leading-6 text-[#8f98a6]">{guide.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#262d3a] bg-[#111620]">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:py-20">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[#71d6a5]"><LockKeyhole size={14} /> Browser-based authorization</div>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-.04em]">Your AI gets permission—not your password.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#8f98a6]">Jobing AI uses OAuth with PKCE. Tokens are stored as one-way hashes, access can be revoked, and new connector tools appear automatically after you connect.</p>
          </div>
          <button onClick={copyEndpoint} className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-md bg-[#c6f24e] px-5 font-semibold text-[#0e1219] hover:bg-[#d4fa6e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:self-center">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Server URL copied" : "Copy server URL"}
          </button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1120px] flex-col gap-5 px-5 py-8 text-xs text-[#6f7886] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5"><Image src="/logo.png" alt="" width={22} height={22} className="h-5 w-5 rounded-[5px]" /><span>Jobing AI · 2026</span></div>
        <div className="flex gap-5"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><a href="mailto:hello@jobing.site" className="hover:text-white">Support</a></div>
      </footer>
    </main>
  );
}
