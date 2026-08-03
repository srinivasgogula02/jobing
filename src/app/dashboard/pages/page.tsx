import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowUpRight, Edit3, Globe2, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getUserPagesForUser } from "@/app/actions/pages";
import { publicPageAddress, publicPageUrl } from "@/lib/pages-runtime-url";
import { getPageEntitlement } from "@/lib/page-entitlements";
import { listPageDomains } from "@/lib/page-domain-service";
import { PageDomainsPanel } from "./PageDomainsPanel";
import { PageAddressForm } from "./PageAddressForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pages | Jobing AI Dashboard",
  description: "View and edit the websites published through Jobing AI.",
  robots: { index: false, follow: false },
};

function updatedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently updated";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function DashboardPagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/pages");
  const [pages, domains, entitlement] = await Promise.all([
    getUserPagesForUser(userId),
    listPageDomains(userId),
    getPageEntitlement(userId),
  ]);
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const atLimit = pages.length >= entitlement.pageLimit;

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pages" }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#719500]">Jobing AI Pages</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-[#151914] sm:text-4xl">Your published pages</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6e756b]">Open the live website your customers see, or return to the HTML editor to make a change.</p>
            </div>
            <Link href={atLimit ? "/pricing?from=page-limit" : "/pages"} style={{ color: "#fff" }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-[#151914] px-5 font-semibold hover:bg-[#293025] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#719500]">
              <Plus size={17} /> {atLimit ? "Upgrade to add a page" : "Create a page"}
            </Link>
          </header>

          <div className="mt-5 flex flex-col gap-2 border border-[#dfe3da] bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[#5f675c]"><strong className="text-[#151914]">{pages.length} of {entitlement.pageLimit} pages</strong> used on {entitlement.planName}.</p>
            {atLimit ? <Link href="/pricing?from=page-limit" className="font-semibold text-[#4f7000] underline underline-offset-4">Compare plans</Link> : <span className="text-[#7b8277]">{entitlement.pageLimit - pages.length} remaining</span>}
          </div>

          <PageDomainsPanel domains={domains} limit={entitlement.customDomainLimit} planName={entitlement.planName} />

          {pages.length === 0 ? (
            <section className="mt-7 grid min-h-[360px] place-items-center rounded-[4px] border border-dashed border-[#cbd1c6] bg-white p-7 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-[4px] bg-[#eaf8dc] text-[#4b7000]"><Globe2 size={25} /></span>
                <h2 className="mt-5 text-xl font-bold text-[#151914]">No published pages yet</h2>
                <p className="mt-2 text-sm leading-6 text-[#6e756b]">Ask your connected AI to publish a website, or open the editor and paste your own HTML.</p>
                <Link href="/pages" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[4px] bg-[#c1ff00] px-5 font-semibold text-[#151914]">Open page editor</Link>
              </div>
            </section>
          ) : (
            <div className="mt-7 overflow-hidden rounded-[4px] border border-[#dfe3da] bg-white">
              <div className="hidden grid-cols-[minmax(0,1fr)_190px_220px] border-b border-[#e5e8e1] bg-[#fbfcf9] px-6 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-[#7b8277] md:grid">
                <span>Page</span><span>Last updated</span><span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-[#e8ebe5]">
                {pages.map((page) => {
                  const domain = page.custom_domain_id ? domainById.get(page.custom_domain_id) : undefined;
                  const customUrl = domain && domain.status === "verified"
                    ? `https://${domain.hostname}/${page.custom_path}`
                    : null;
                  const liveUrl = customUrl ?? publicPageUrl(page.id);
                  return (
                    <article key={page.id} className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_190px_220px] md:items-center md:px-6">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-[#eef5e8] text-[#567800]"><Globe2 size={18} /></span>
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold text-[#151914]">{page.id}</h2>
                            <p className="mt-1 truncate font-mono text-[11px] text-[#8a9186]">{customUrl?.replace(/^https?:\/\//, "") ?? publicPageAddress(page.id)}</p>
                            {domain && domain.status !== "verified" ? <p className="mt-1 text-xs text-[#8a6413]">{domain.hostname}/{page.custom_path} is waiting for DNS</p> : null}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#6e756b]"><span className="mr-2 font-mono text-[10px] uppercase text-[#999f96] md:hidden">Updated</span>{updatedLabel(page.updated_at)}</p>
                      <div className="flex gap-2 md:justify-end">
                        <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#151914" }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[4px] border border-[#d4d9d0] px-4 text-sm font-semibold hover:bg-[#f7f8f4] md:flex-none">
                          View <ArrowUpRight size={15} />
                        </a>
                        <Link href={`/pages/${encodeURIComponent(page.id)}/edit`} style={{ color: "#fff" }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[4px] bg-[#151914] px-4 text-sm font-semibold hover:bg-[#293025] md:flex-none">
                          Edit <Edit3 size={15} />
                        </Link>
                      </div>
                      <div className="md:col-span-3">
                        <PageAddressForm pageId={page.id} currentDomainId={page.custom_domain_id} currentPath={page.custom_path} domains={domains.map(({ id, hostname, status }) => ({ id, hostname, status }))} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
