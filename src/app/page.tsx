import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code, Copy } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <nav className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-2 font-extrabold">
            <Image src="/logo.png" alt="Jobing" width={52} height={20} className="h-6 w-auto object-contain" priority />
            Jobing
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/blog" className="text-[#6b7280] hover:text-black">Blog</Link>
            <Link href="/tools" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-white">All tools</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-[#6b7280]">Simple tools. No clutter.</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Useful web tools that get out of your way.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#6b7280]">
          Share text between devices, preview HTML instantly, and use focused utilities without installing anything.
        </p>
        <Link href="/tools" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#C1FF00] px-6 py-3.5 font-bold text-black">
          Explore tools <ArrowRight size={18} />
        </Link>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 border-t border-l border-[#e5e5e5] sm:grid-cols-2">
        <Link href="/copy" className="group border-r border-b border-[#e5e5e5] p-8 transition-colors hover:bg-[#f8fafc] md:p-12">
          <Copy className="mb-8" size={28} />
          <h2 className="text-2xl font-extrabold">Jobing Clipboard</h2>
          <p className="mt-3 max-w-md text-[#6b7280]">Create a note and open it anywhere with a short, shareable link.</p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Open clipboard <ArrowRight size={16} /></span>
        </Link>
        <Link href="/pages" className="group border-r border-b border-[#e5e5e5] p-8 transition-colors hover:bg-[#f7fee7] md:p-12">
          <Code className="mb-8" size={28} />
          <h2 className="text-2xl font-extrabold">HTML Online Viewer</h2>
          <p className="mt-3 max-w-md text-[#6b7280]">Write HTML and see the result immediately in a live preview.</p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Open viewer <ArrowRight size={16} /></span>
        </Link>
      </section>
    </main>
  );
}
