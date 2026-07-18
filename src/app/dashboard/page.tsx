import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Edit3,
  FilePenLine,
  FormInput,
  Globe2,
  Inbox,
  Plus,
  PlugZap,
} from "lucide-react";
import { createFormAction } from "@/app/app/actions";
import { getUserPagesForUser } from "@/app/actions/pages";
import { DashboardConnectorStrip } from "@/components/DashboardConnectorStrip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getUserSubscriptionForUser } from "@/lib/billing-data";
import { FREE_FORMS_LIMITS, getBillingPlanByProductId } from "@/lib/billing-plans";
import { listDashboardForms } from "@/lib/dashboard-forms";
import { resolveDashboardNextStep, usagePercentage } from "@/lib/dashboard-overview";
import { listOAuthGrants } from "@/lib/oauth";
import { publicPageAddress, publicPageUrl } from "@/lib/pages-runtime-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Jobing AI",
  description: "Continue recent work, see workspace status, and manage pages, forms, AI connections, limits, and billing.",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "pending", "on_hold"]);

function dateLabel(value: string | null | undefined) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently updated";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function reportRejected(label: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "rejected") {
    console.error(`[dashboard] Could not load ${label}`, result.reason instanceof Error ? { name: result.reason.name } : { type: typeof result.reason });
    return true;
  }
  return false;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const [params, pagesResult, formsResult, grantsResult, subscriptionResult] = await Promise.all([
    searchParams,
    Promise.resolve(getUserPagesForUser(userId)).then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
    Promise.resolve(listDashboardForms(userId)).then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
    Promise.resolve(listOAuthGrants(userId)).then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
    Promise.resolve(getUserSubscriptionForUser(userId)).then((value) => ({ status: "fulfilled" as const, value }), (reason) => ({ status: "rejected" as const, reason })),
  ]);

  const pages = pagesResult.status === "fulfilled" ? pagesResult.value : [];
  const forms = formsResult.status === "fulfilled" ? formsResult.value : [];
  const grants = grantsResult.status === "fulfilled" ? grantsResult.value : [];
  const subscription = subscriptionResult.status === "fulfilled" ? subscriptionResult.value : null;
  const unavailable = [
    reportRejected("pages", pagesResult),
    reportRejected("forms", formsResult),
    reportRejected("connections", grantsResult),
    reportRejected("billing", subscriptionResult),
  ].some(Boolean);

  const plan = subscription?.product_id && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    ? getBillingPlanByProductId(subscription.product_id)
    : null;
  const limits = plan?.limits ?? FREE_FORMS_LIMITS;
  const publishedForms = forms.filter((form) => form.status === "published");
  const drafts = forms.filter((form) => form.status === "draft");
  const formUsage = usagePercentage(forms.length, limits["forms.total"]);
  const latestConnectionUse = grants.map((grant) => grant.lastUsedAt).filter((value): value is string => Boolean(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  const nextStep = resolveDashboardNextStep({
    connectionCount: grantsResult.status === "fulfilled" ? grants.length : 1,
    pages,
    forms,
  });

  const recentWork = [
    ...pages.map((page) => ({
      key: `page:${page.id}`,
      kind: "page" as const,
      title: page.id,
      detail: publicPageAddress(page.id),
      status: "Published",
      updatedAt: page.updated_at,
      href: `/pages/${page.id}/edit`,
      action: "Edit page",
      publicUrl: publicPageUrl(page.id),
    })),
    ...forms.map((form) => ({
      key: `form:${form.id}`,
      kind: "form" as const,
      title: form.name,
      detail: `${form.fieldCount} question${form.fieldCount === 1 ? "" : "s"}`,
      status: form.status === "published" ? "Published" : form.status === "draft" ? "Private draft" : form.status,
      updatedAt: form.updatedAt,
      href: form.status === "published" ? `/dashboard/forms/${form.id}` : `/dashboard/forms/${form.id}/edit`,
      action: form.status === "published" ? "View responses" : "Continue editing",
      publicUrl: null,
    })),
  ].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 6);

  return (
    <DashboardLayout fullBleed breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          {params.checkout === "returned" ? (
            <div className="mb-5 flex flex-col gap-3 rounded-[4px] border border-[#b5dc37] bg-[#f2ffd0] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#1d2a0d]">Checkout complete</p>
                <p className="mt-1 text-sm text-[#5b6848]">Your payment is being confirmed. Plan access normally appears within a few seconds.</p>
              </div>
              <Link href="/billing" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#27350f]">Check billing <ArrowRight size={16} /></Link>
            </div>
          ) : null}

          {unavailable ? (
            <div className="mb-5 flex items-start gap-3 rounded-[4px] border border-[#e4d1a4] bg-[#fff9e9] px-4 py-3 text-sm text-[#73551a]" role="status">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              <p>Some workspace information could not be loaded. Your pages, forms, and connections are still available from the sidebar. Refresh to try the overview again.</p>
            </div>
          ) : null}

          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#719500]">Workspace overview</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-[#151914] sm:text-4xl">Your work, ready to continue.</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6e756b]">See what is live, finish what is still private, and move directly to the next useful action.</p>
            </div>
            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <form action={createFormAction}><button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#cfd4cb] bg-white px-4 text-sm font-semibold text-[#151914] hover:bg-[#f0f2ed]"><Plus size={16} /> New form</button></form>
              <Link href="/pages" style={{ color: "#fff" }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[4px] bg-[#151914] px-4 text-sm font-semibold hover:bg-[#293025]"><Plus size={16} /> New page</Link>
            </div>
          </header>

          <div className="mt-6"><DashboardConnectorStrip /></div>

          <section className="mt-4 grid border border-[#dfe3da] bg-white sm:grid-cols-3" aria-label="Workspace status">
            <div className="flex items-center gap-4 border-b border-[#e5e8e1] p-5 sm:border-b-0 sm:border-r">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] bg-[#e5f6fc] text-[#155e75]"><Globe2 size={18} /></span>
              <div><p className="text-2xl font-bold tracking-[-.04em] text-[#151914]">{pagesResult.status === "fulfilled" ? pages.length : "—"}</p><p className="text-xs text-[#747c71]">Published page{pages.length === 1 ? "" : "s"}</p></div>
            </div>
            <div className="flex items-center gap-4 border-b border-[#e5e8e1] p-5 sm:border-b-0 sm:border-r">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] bg-[#eefbd0] text-[#527800]"><FormInput size={18} /></span>
              <div><p className="text-2xl font-bold tracking-[-.04em] text-[#151914]">{formsResult.status === "fulfilled" ? publishedForms.length : "—"}<span className="text-sm font-medium text-[#9aa095]">/{limits["forms.published"]}</span></p><p className="text-xs text-[#747c71]">Published forms · {drafts.length} draft{drafts.length === 1 ? "" : "s"}</p></div>
            </div>
            <div className="flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] bg-[#f0ebff] text-[#6844a5]"><PlugZap size={18} /></span>
              <div><p className="text-2xl font-bold tracking-[-.04em] text-[#151914]">{grantsResult.status === "fulfilled" ? grants.length : "—"}</p><p className="text-xs text-[#747c71]">AI connection{grants.length === 1 ? "" : "s"}{latestConnectionUse ? ` · used ${dateLabel(latestConnectionUse)}` : ""}</p></div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-4">
              <section className="grid overflow-hidden border border-[#151914] bg-[#151914] text-white sm:grid-cols-[1fr_auto]" aria-labelledby="next-step-title">
                <div className="p-6 sm:p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#baff29]">Recommended next step</p>
                  <h2 id="next-step-title" className="mt-3 text-2xl font-bold tracking-[-.035em]">{nextStep.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{nextStep.body}</p>
                  <Link href={nextStep.href} style={{ color: "#151914" }} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-[4px] bg-[#baff29] px-4 text-sm font-bold hover:bg-[#a9eb16]">{nextStep.action} <ArrowRight size={15} /></Link>
                </div>
                <div className="hidden w-32 place-items-center border-l border-white/15 sm:grid" aria-hidden="true">
                  {nextStep.kind === "connect" ? <PlugZap className="text-[#baff29]" size={38} /> : nextStep.kind === "finish_form" ? <FilePenLine className="text-[#baff29]" size={38} /> : nextStep.kind === "review_responses" ? <Inbox className="text-[#baff29]" size={38} /> : <Globe2 className="text-[#baff29]" size={38} />}
                </div>
              </section>

              <section className="border border-[#dfe3da] bg-white" aria-labelledby="recent-work-title">
                <header className="flex items-center justify-between border-b border-[#e5e8e1] px-5 py-4">
                  <div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#719500]">Continue where you left off</p><h2 id="recent-work-title" className="mt-1 font-bold text-[#151914]">Recent work</h2></div>
                  <div className="flex gap-3 text-xs font-semibold"><Link href="/dashboard/pages" className="text-[#5f675d] hover:text-[#151914]">All pages</Link><Link href="/dashboard/forms" className="text-[#5f675d] hover:text-[#151914]">All forms</Link></div>
                </header>

                {recentWork.length === 0 ? (
                  <div className="p-7 text-center sm:p-10">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-[3px] bg-[#eefbd0] text-[#527800]"><CheckCircle2 size={21} /></span>
                    <h3 className="mt-4 font-bold text-[#151914]">This workspace is ready for its first project.</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747c71]">Create a page, a form, or ask your connected AI to create both together. The result will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8ebe5]">
                    {recentWork.map((item) => (
                      <article key={item.key} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[3px] ${item.kind === "page" ? "bg-[#e5f6fc] text-[#155e75]" : "bg-[#eefbd0] text-[#527800]"}`}>{item.kind === "page" ? <Globe2 size={17} /> : <FormInput size={17} />}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-[#151914]">{item.title}</h3><span className="rounded-[3px] bg-[#f0f2ed] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#6e756b]">{item.status}</span></div>
                          <p className="mt-1 truncate text-xs text-[#858c82]">{item.detail} · Updated {dateLabel(item.updatedAt)}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {item.publicUrl ? <a href={item.publicUrl} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[4px] border border-[#d5dad1] px-3 text-xs font-semibold text-[#4f574d] hover:bg-[#f5f6f3]">View <ArrowUpRight size={13} /></a> : null}
                          <Link href={item.href} style={{ color: "#fff" }} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[4px] bg-[#151914] px-3 text-xs font-semibold hover:bg-[#293025]">{item.action} <Edit3 size={13} /></Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="border border-[#dfe3da] bg-white p-5" aria-labelledby="usage-title">
                <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#719500]">{plan?.name ?? "Free"} plan</p><h2 id="usage-title" className="mt-1 font-bold text-[#151914]">Workspace allowance</h2></div><CreditCard size={18} className="text-[#858c82]" /></div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#50584e]">Forms created</span><span className="font-mono text-[#6e756b]">{forms.length} / {limits["forms.total"]}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden bg-[#e7eae4]"><div className="h-full bg-[#719500]" style={{ width: `${formUsage}%` }} /></div>
                </div>
                <dl className="mt-5 space-y-3 border-t border-[#e5e8e1] pt-4 text-xs">
                  <div className="flex items-center justify-between"><dt className="text-[#747c71]">Published forms</dt><dd className="font-mono font-semibold text-[#151914]">{publishedForms.length} / {limits["forms.published"]}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-[#747c71]">Visible responses / month</dt><dd className="font-mono font-semibold text-[#151914]">{limits["submissions.accepted"].toLocaleString()}</dd></div>
                </dl>
                <p className="mt-4 text-[11px] leading-5 text-[#858c82]">Valid responses keep saving after the viewing allowance is reached.</p>
                <Link href={plan ? "/billing" : "/pricing"} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[4px] border border-[#cfd4cb] text-xs font-semibold text-[#151914] hover:bg-[#f5f6f3]">{plan ? "Manage billing" : "Compare plans"} <ArrowRight size={13} /></Link>
              </section>

              <section className="border border-[#dfe3da] bg-white" aria-labelledby="quick-actions-title">
                <header className="border-b border-[#e5e8e1] px-5 py-4"><h2 id="quick-actions-title" className="font-bold text-[#151914]">Go directly to</h2></header>
                <nav className="divide-y divide-[#e8ebe5]" aria-label="Quick workspace actions">
                  <Link href="/dashboard/pages" className="flex min-h-14 items-center gap-3 px-5 text-sm font-semibold text-[#50584e] hover:bg-[#f8f9f6]"><Globe2 size={16} className="text-[#719500]" /><span className="flex-1">Manage pages</span><ArrowRight size={14} /></Link>
                  <Link href="/dashboard/forms" className="flex min-h-14 items-center gap-3 px-5 text-sm font-semibold text-[#50584e] hover:bg-[#f8f9f6]"><FormInput size={16} className="text-[#719500]" /><span className="flex-1">Forms and responses</span><ArrowRight size={14} /></Link>
                  <Link href="/connector/manage" className="flex min-h-14 items-center gap-3 px-5 text-sm font-semibold text-[#50584e] hover:bg-[#f8f9f6]"><PlugZap size={16} className="text-[#719500]" /><span className="flex-1">AI connections</span><ArrowRight size={14} /></Link>
                </nav>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
