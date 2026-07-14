"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicSiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#e1e4dc] bg-[#f7f8f4]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-[-.025em] text-[#151914]">
          <Image src="/logo.png" alt="" width={34} height={34} className="rounded-lg" priority />
          <span>Jobing AI</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#656d62] md:flex" aria-label="Main navigation">
          <Link href="/#connect" className="hover:text-[#151914]">How to connect</Link>
          <Link href="/#use-cases" className="hover:text-[#151914]">What it can do</Link>
          <Link href="/pricing" className="text-[#151914]">Pricing</Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl bg-[#151914] px-4 text-white hover:bg-[#293025]">Dashboard</Link>
        </nav>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-[#d8ddd3] text-[#151914] md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open ? <nav className="grid gap-1 border-t border-[#e1e4dc] bg-[#f7f8f4] p-3 text-sm font-semibold text-[#555d52] md:hidden" aria-label="Mobile navigation"><Link className="min-h-11 rounded-lg px-3 py-3" href="/#connect" onClick={() => setOpen(false)}>How to connect</Link><Link className="min-h-11 rounded-lg px-3 py-3" href="/#use-cases" onClick={() => setOpen(false)}>What it can do</Link><Link className="min-h-11 rounded-lg px-3 py-3" href="/pricing" onClick={() => setOpen(false)}>Pricing</Link><Link className="min-h-11 rounded-lg bg-[#151914] px-3 py-3 text-center text-white" href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></nav> : null}
    </header>
  );
}
