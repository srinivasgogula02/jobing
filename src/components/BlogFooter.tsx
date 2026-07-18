import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BlogFooter() {
  return (
    <footer className="border-t border-[#272c26] bg-[#151914] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#baff29]">From reading to doing</p>
          <h2 className="mt-4 font-[family-name:var(--font-home-display)] text-3xl font-semibold leading-[1.08] tracking-[-.035em] sm:text-5xl">
            Give your AI a job, not another question.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
            Connect Jobing once. Then ask your AI to publish a web page, create a custom form, or help you understand the responses.
          </p>
        </div>
        <Link
          href="/connector"
          className="inline-flex min-h-12 w-fit items-center justify-center gap-2 bg-[#baff29] px-5 text-sm font-bold text-[#151914] transition-colors hover:bg-[#a9eb16] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#baff29]"
        >
          Connect Jobing AI <ArrowRight size={16} />
        </Link>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
            Jobing AI
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Guide footer navigation">
            <Link href="/dashboard/pages" prefetch={false} className="hover:text-white">Pages</Link>
            <Link href="/dashboard/forms" prefetch={false} className="hover:text-white">Forms</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/feedback" className="hover:text-white">Feedback</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
