"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { setPageAddressAction } from "./actions";

type DomainOption = { id: string; hostname: string; status: "provisioning" | "pending" | "verified" | "error" };

export function PageAddressForm({ pageId, currentDomainId, currentPath, domains }: { pageId: string; currentDomainId: string | null; currentPath: string; domains: DomainOption[] }) {
  const [domainId, setDomainId] = useState(currentDomainId ?? "");
  const [path, setPath] = useState(currentPath);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => startTransition(async () => {
    setMessage(null);
    const result = await setPageAddressAction({ pageId, domainId: domainId || null, path });
    if (!result.ok) return setMessage(result.error);
    setMessage(result.data?.ready ? "Custom address saved and live." : domainId ? "Address saved. It will work after the domain is verified." : "This page now uses its Jobing address.");
  });

  return <details className="mt-4 border-t border-[#e8ebe5] pt-4">
    <summary className="cursor-pointer text-sm font-semibold text-[#4f584c]">Change custom address</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <label><span className="mb-1 block font-mono text-[9px] uppercase tracking-[.1em] text-[#8a9186]">Domain</span><select value={domainId} onChange={(event) => setDomainId(event.target.value)} className="min-h-11 w-full border border-[#cfd5cb] bg-white px-3 text-sm text-[#151914]"><option value="">Jobing address only</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.hostname}{domain.status === "verified" ? "" : " (DNS pending)"}</option>)}</select></label>
      <label><span className="mb-1 block font-mono text-[9px] uppercase tracking-[.1em] text-[#8a9186]">Page path</span><div className={`flex min-h-11 items-center border border-[#cfd5cb] ${domainId ? "bg-white" : "bg-[#f1f3ee]"}`}><span className="pl-3 text-[#9a9f97]">/</span><input value={path} onChange={(event) => setPath(event.target.value.toLowerCase())} disabled={!domainId} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby={`${pageId}-path-help`} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-[#151914] outline-none disabled:cursor-not-allowed disabled:text-[#90968d]" /></div><span id={`${pageId}-path-help`} className="mt-1 block text-[11px] text-[#8a9186]">{domainId ? "Letters, numbers, and hyphens." : "Choose a custom domain to edit its path."}</span></label>
      <button onClick={save} disabled={pending} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 bg-[#151914] px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save address</button>
    </div>
    {message ? <p role="status" className="mt-2 text-xs leading-5 text-[#6e756b]">{message}</p> : null}
  </details>;
}
