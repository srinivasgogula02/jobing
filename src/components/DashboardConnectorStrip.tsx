"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";
import { track } from "@/lib/analytics";

const CONNECTOR_URL = "https://jobing.site/mcp";

export function DashboardConnectorStrip() {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(CONNECTOR_URL);
      track("mcp_url_copied", { placement: "dashboard" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy your Jobing AI connector URL", CONNECTOR_URL);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-[#dfe3da] bg-white p-4 shadow-[0_8px_30px_rgba(31,40,25,.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-label="Jobing AI connector">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#719500]">Connector URL</p>
        <code className="mt-1.5 block truncate font-mono text-sm font-semibold text-[#252b23] sm:text-[15px]">{CONNECTOR_URL}</code>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={copyUrl} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cfd4cb] px-4 text-sm font-semibold text-[#151914] hover:bg-[#f7f8f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500]" aria-label={copied ? "Connector URL copied" : "Copy connector URL"}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <Link href="/#connect" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#151914] px-4 text-sm font-semibold text-white hover:bg-[#293025] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] sm:flex-none">
          How to connect <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
