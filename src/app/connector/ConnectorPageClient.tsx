"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, ExternalLink, LockKeyhole, PlugZap } from "lucide-react";

const MCP_URL = "https://jobing.site/mcp";

const platforms = [
  { name: "ChatGPT", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
  { name: "Claude", icon: "https://cdn.simpleicons.org/claude/D97757" },
  { name: "Gemini", icon: "https://cdn.simpleicons.org/googlegemini/8AB4F8" },
  { name: "Cursor", icon: "https://cdn.simpleicons.org/cursor/FFFFFF" },
];

const setupGuides = [
  {
    name: "ChatGPT",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    steps: [
      "Open ChatGPT settings and go to Apps & Connectors.",
      "Choose the option to create or add a custom connector.",
      `Use ${MCP_URL} as the MCP server URL, then connect.`,
      "Sign in to Jobing and approve access when the authorization page opens.",
    ],
  },
  {
    name: "Claude",
    logo: "https://cdn.simpleicons.org/claude/D97757",
    steps: [
      "Open Claude settings and select Connectors.",
      "Choose Add custom connector and give it the name Jobing.",
      `Paste ${MCP_URL} as the remote MCP server URL.`,
      "Continue, sign in to Jobing, and approve the requested access.",
    ],
  },
  {
    name: "Any MCP client",
    logo: null,
    steps: [
      "Open your AI tool’s MCP or integrations settings.",
      "Add a remote HTTP MCP server.",
      `Enter ${MCP_URL} as the endpoint. No client secret is required.`,
      "Complete the browser-based OAuth sign-in and return to your AI tool.",
    ],
  },
];

export function ConnectorPageClient() {
  const [copied, setCopied] = useState(false);

  async function copyEndpoint() {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0e1219] text-[#f2f4f7] selection:bg-[#c6f24e] selection:text-[#0e1219]">
      <nav className="mx-auto flex h-20 max-w-[1180px] items-center justify-between border-x border-[#262d3a] px-5 sm:px-8">
        <Link href="/" className="text-lg font-bold tracking-[-0.04em]">Jobing</Link>
        <div className="flex items-center gap-5 text-sm text-[#aab1bd]">
          <a href="#setup" className="hidden transition-colors hover:text-white sm:block">Setup guide</a>
          <Link href="/tools" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#c6f24e] px-4 font-bold text-[#0e1219] transition-colors hover:bg-[#d3fa69] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6f24e]">
            Explore tools <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-[1180px] border border-[#262d3a] lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 px-5 py-16 sm:px-10 sm:py-24 lg:px-14 lg:py-32">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#37404f] bg-[#161b25] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#c6f24e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c6f24e] shadow-[0_0_12px_#c6f24e]" />
            Remote MCP connector
          </div>
          <h1 className="max-w-[720px] text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
            Give your AI<br />a place to <span className="text-[#c6f24e]">do things.</span>
          </h1>
          <p className="mt-8 max-w-xl text-[17px] leading-7 text-[#aab1bd] sm:text-lg">
            Connect Jobing once, then create notes and deploy pages directly from ChatGPT, Claude, or any AI client that supports remote MCP servers.
          </p>

          <div className="mt-10 max-w-xl rounded-xl border border-[#343c49] bg-[#161b25] p-2 shadow-[0_24px_80px_rgba(0,0,0,.28)]">
            <div className="flex items-center gap-3 rounded-lg bg-[#0e1219] p-2 pl-4">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-[#d8dce3]">{MCP_URL}</span>
              <button onClick={copyEndpoint} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-[#c6f24e] px-4 text-sm font-bold text-[#0e1219] transition-colors hover:bg-[#d3fa69] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Copy MCP server URL">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy URL"}</span>
              </button>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-[#737d8d]"><LockKeyhole size={13} /> OAuth sign-in · no API key to paste · revoke anytime</p>
        </div>

        <div className="relative min-h-[460px] overflow-hidden border-t border-[#262d3a] bg-[#111620] lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#303846_1px,transparent_1px),linear-gradient(90deg,#303846_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="absolute left-1/2 top-1/2 h-[72%] w-px -translate-x-1/2 -translate-y-1/2 bg-[#3c4656]" />
          <div className="absolute left-[18%] right-[18%] top-1/2 h-px bg-[#3c4656]" />
          <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-[#c6f24e]/50 bg-[#161b25] shadow-[0_0_80px_rgba(198,242,78,.12)]">
            <PlugZap className="text-[#c6f24e]" size={28} />
            <span className="mt-2 font-mono text-xs font-semibold uppercase tracking-[.16em]">Jobing</span>
          </div>
          {platforms.map((platform, index) => {
            const positions = ["left-[12%] top-[18%]", "right-[12%] top-[18%]", "left-[12%] bottom-[18%]", "right-[12%] bottom-[18%]"];
            return (
              <div key={platform.name} className={`absolute z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#343d4b] bg-[#1a202b] shadow-xl sm:h-24 sm:w-24 ${positions[index]}`}>
                {/* External brand assets remain visually isolated from user content. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={platform.icon} alt={`${platform.name} logo`} className="h-8 w-8 sm:h-10 sm:w-10" />
                <span className="absolute -bottom-6 text-[11px] font-medium text-[#8b93a1]">{platform.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] border-x border-b border-[#262d3a] px-5 py-20 sm:px-10 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.16em] text-[#c6f24e]">Available now</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Two useful actions.<br />One connection.</h2>
          </div>
          <div className="grid border-l border-t border-[#303744] sm:grid-cols-2">
            <article className="border-b border-r border-[#303744] bg-[#161b25] p-7 sm:p-9">
              <span className="font-mono text-xs text-[#c6f24e]">TOOL / 01</span>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight">Create a note</h3>
              <p className="mt-3 leading-6 text-[#8b93a1]">Ask your AI to save structured text as a Jobing note and return a shareable link.</p>
              <p className="mt-7 border-l-2 border-[#c6f24e] pl-4 text-sm italic text-[#cbd0d8]">“Create a note with these meeting decisions.”</p>
            </article>
            <article className="border-b border-r border-[#303744] bg-[#161b25] p-7 sm:p-9">
              <span className="font-mono text-xs text-[#c6f24e]">TOOL / 02</span>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight">Deploy a page</h3>
              <p className="mt-3 leading-6 text-[#8b93a1]">Turn HTML into a hosted page and get a public URL without leaving the conversation.</p>
              <p className="mt-7 border-l-2 border-[#c6f24e] pl-4 text-sm italic text-[#cbd0d8]">“Deploy this landing page and send me the link.”</p>
            </article>
          </div>
        </div>
      </section>

      <section id="setup" className="mx-auto max-w-[1180px] scroll-mt-8 border-x border-b border-[#262d3a] px-5 py-20 sm:px-10 lg:px-14 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[.16em] text-[#c6f24e]">Setup</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Connected in a few minutes.</h2>
          <p className="mt-5 text-lg leading-7 text-[#8b93a1]">The exact menu label can vary by plan and client version. The server URL stays the same.</p>
        </div>

        <div className="mt-12 divide-y divide-[#303744] border-y border-[#303744]">
          {setupGuides.map((guide) => (
            <article key={guide.name} className="grid gap-7 py-10 lg:grid-cols-[260px_1fr] lg:py-12">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  {guide.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={guide.logo} alt={`${guide.name} logo`} className="h-7 w-7" />
                  ) : <PlugZap className="text-[#111827]" size={25} />}
                </span>
                <h3 className="text-xl font-semibold">{guide.name}</h3>
              </div>
              <ol className="grid gap-5 sm:grid-cols-2">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-[#b5bbc6]">
                    <span className="mt-0.5 font-mono text-xs text-[#c6f24e]">{String(index + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] border-x border-b border-[#262d3a] lg:grid-cols-2">
        <div className="border-b border-[#262d3a] px-5 py-16 sm:px-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-20">
          <LockKeyhole className="text-[#c6f24e]" size={28} />
          <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Your account stays yours.</h2>
          <p className="mt-4 max-w-lg leading-7 text-[#8b93a1]">Jobing uses browser-based OAuth with PKCE. Your AI client never sees your password, and access tokens are stored as one-way hashes. Disconnect the connector from your AI tool whenever you want.</p>
        </div>
        <div className="px-5 py-16 sm:px-10 lg:px-14 lg:py-20">
          <p className="font-mono text-xs uppercase tracking-[.16em] text-[#c6f24e]">Built to grow</p>
          <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">New tools arrive automatically.</h2>
          <p className="mt-4 max-w-lg leading-7 text-[#8b93a1]">Connect once. As Jobing adds more actions, compatible AI clients can discover them without a new endpoint or another account connection.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] border-x border-b border-[#262d3a] px-5 py-20 text-center sm:px-10 lg:py-28">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-[#c6f24e]">One URL. Your AI. Real actions.</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Move work out of the chat and into the world.</h2>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={copyEndpoint} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#c6f24e] px-6 font-bold text-[#0e1219] hover:bg-[#d3fa69] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6f24e]">
            {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Endpoint copied" : "Copy connector URL"}
          </button>
          <Link href="/tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#3a4351] px-6 font-semibold text-white hover:bg-[#161b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            See what Jobing can do <ExternalLink size={16} />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1180px] flex-col gap-4 border-x border-[#262d3a] px-5 py-8 text-xs text-[#737d8d] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
        <span>© 2026 Jobing AI</span>
        <div className="flex gap-5"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><a href="mailto:hello@jobing.site" className="hover:text-white">Support</a></div>
      </footer>
    </main>
  );
}
