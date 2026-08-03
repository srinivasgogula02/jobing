"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, Globe2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { PageDomain, PageDnsRecord } from "@/lib/page-domain-service";
import { addPageDomainAction, refreshPageDomainAction, removePageDomainAction } from "./actions";

function statusCopy(status: PageDomain["status"]) {
  if (status === "verified") return { label: "Live", copy: "Pages assigned to this domain are available over HTTPS.", classes: "bg-[#e8f8dc] text-[#416700]" };
  if (status === "error") return { label: "Needs attention", copy: "Setup did not finish. Retry to load the latest DNS instructions.", classes: "bg-[#fff0e7] text-[#9a3f13]" };
  return { label: "Waiting for DNS", copy: "Add the records below at your domain provider, then check again.", classes: "bg-[#fff7d6] text-[#785d00]" };
}

export function PageDomainsPanel({ domains, limit, planName }: { domains: PageDomain[]; limit: number; planName: string }) {
  const [hostname, setHostname] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () => startTransition(async () => {
    setMessage(null);
    const result = await addPageDomainAction(hostname);
    if (!result.ok) return setMessage({ type: "error", text: result.error });
    setHostname("");
    setMessage({ type: "success", text: `${result.data?.hostname} was added. Complete its DNS records below.` });
  });

  const refresh = (domainId: string) => startTransition(async () => {
    setMessage(null);
    const result = await refreshPageDomainAction(domainId);
    setMessage(result.ok
      ? { type: "success", text: result.data?.ready ? "The domain is verified and live." : "DNS is not ready yet. Changes can take a little time to spread." }
      : { type: "error", text: result.error });
  });

  const remove = (domain: PageDomain) => {
    if (!window.confirm(`Remove ${domain.hostname} from Jobing? Its Jobing URLs will keep working.`)) return;
    startTransition(async () => {
      setMessage(null);
      const result = await removePageDomainAction(domain.id);
      setMessage(result.ok ? { type: "success", text: `${domain.hostname} was removed.` } : { type: "error", text: result.error });
    });
  };

  return (
    <section id="custom-domains" className="mt-6 border border-[#dfe3da] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#719500]">Custom domains</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-.025em] text-[#151914]">Publish on an address customers recognize</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e756b]">Connect a domain once, then give each page a clear path such as <span className="font-mono text-[#3d443a]">example.com/contact</span>.</p>
        </div>
        <div className="shrink-0 border border-[#e0e4dc] bg-[#f8f9f6] px-3 py-2 text-sm text-[#5f675c]">
          <strong className="text-[#151914]">{domains.length} of {limit}</strong> on {planName}
        </div>
      </div>

      {limit === 0 ? (
        <div className="mt-5 flex flex-col gap-4 border border-[#dfe3da] bg-[#f8f9f6] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#5f675c]">Custom domains start on Starter. Your existing <span className="font-mono">jobing.online</span> page addresses keep working.</p>
          <Link href="/pricing?from=custom-domain" className="inline-flex min-h-11 shrink-0 items-center justify-center bg-[#151914] px-4 text-sm font-semibold text-white">See plans</Link>
        </div>
      ) : domains.length < limit ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Domain to connect</span>
            <input value={hostname} onChange={(event) => setHostname(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="example.com or pages.example.com" inputMode="url" autoCapitalize="none" autoCorrect="off" className="min-h-12 w-full border border-[#cfd5cb] bg-white px-4 text-[15px] text-[#151914] outline-none focus:border-[#719500] focus:ring-2 focus:ring-[#c1ff00]/40" />
          </label>
          <button onClick={add} disabled={pending || !hostname.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#151914] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Globe2 size={16} />} Connect domain
          </button>
        </div>
      ) : (
        <p className="mt-5 border border-[#eadcb7] bg-[#fff9e8] p-4 text-sm text-[#6d5721]">You are using every custom domain on this plan. Remove one or <Link href="/pricing?from=custom-domain-limit" className="font-semibold underline">compare plans</Link>.</p>
      )}

      {message ? <p role="status" className={`mt-4 border p-3 text-sm ${message.type === "error" ? "border-[#efc2ad] bg-[#fff5f0] text-[#8b3511]" : "border-[#cce5b9] bg-[#f2faec] text-[#365b19]"}`}>{message.text}</p> : null}

      {domains.length ? <div className="mt-5 divide-y divide-[#e7eae4] border border-[#dfe3da]">
        {domains.map((domain) => {
          const status = statusCopy(domain.status);
          const records = domain.dns_records as PageDnsRecord[];
          return <article key={domain.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-all font-semibold text-[#151914]">{domain.hostname}</h3>
                  <span className={`px-2 py-1 text-[11px] font-semibold ${status.classes}`}>{status.label}</span>
                  {domain.is_default ? <span className="border border-[#d8ddd4] px-2 py-1 text-[10px] uppercase tracking-[.1em] text-[#747c71]">Default</span> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6e756b]">{status.copy}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => refresh(domain.id)} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#cfd5cb] px-3 text-sm font-semibold text-[#151914] disabled:opacity-50"><RefreshCw size={15} /> Check DNS</button>
                <button onClick={() => remove(domain)} disabled={pending} aria-label={`Remove ${domain.hostname}`} className="inline-grid min-h-11 min-w-11 place-items-center border border-[#efc8b8] text-[#9a3f13] disabled:opacity-50"><Trash2 size={16} /></button>
              </div>
            </div>

            {domain.status !== "verified" && records.length ? <div className="mt-4 overflow-x-auto border border-[#e3e6df]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#f7f8f4] font-mono text-[10px] uppercase tracking-[.1em] text-[#7b8277]"><tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Value</th><th className="w-12"><span className="sr-only">Copy</span></th></tr></thead>
                <tbody className="divide-y divide-[#e8ebe5]">{records.map((record, index) => <tr key={`${record.type}-${record.name}-${index}`}><td className="px-3 py-3 font-mono text-xs">{record.type}</td><td className="px-3 py-3 font-mono text-xs">{record.name}</td><td className="max-w-[320px] break-all px-3 py-3 font-mono text-xs">{record.value}</td><td className="px-2"><button onClick={() => navigator.clipboard.writeText(record.value)} aria-label={`Copy ${record.type} value`} className="grid min-h-11 min-w-11 place-items-center text-[#596157] hover:bg-[#f2f4ef]"><Copy size={15} /></button></td></tr>)}</tbody>
              </table>
            </div> : null}
            {domain.status !== "verified" && !records.length ? <p className="mt-4 border border-[#e3e6df] bg-[#f8f9f6] p-3 text-sm text-[#6e756b]">Select <strong>Check DNS</strong> to load the exact records for this domain.</p> : null}
            {domain.status === "verified" ? <p className="mt-4 flex items-center gap-2 text-sm text-[#416700]"><Check size={16} /> HTTPS is managed automatically.</p> : null}
          </article>;
        })}
      </div> : null}
    </section>
  );
}
