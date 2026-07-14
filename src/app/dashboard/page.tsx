import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  FormInput,
  Globe2,
  PlugZap,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getUserPages } from "@/app/actions/pages";
import { getUserSubscription } from "@/app/actions/billing";
import { FORMS_APP_PATH } from "@/lib/app-navigation";
import { getBillingPlanByProductId } from "@/lib/billing-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Jobing AI",
  description: "Manage the pages, forms, AI connections, and billing in your Jobing AI account.",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

const destinations = [
  {
    title: "Pages",
    description: "View every published website and continue editing it.",
    href: "/dashboard/pages",
    action: "Manage pages",
    icon: Globe2,
    accent: "bg-[#dff5ff] text-[#155e75]",
  },
  {
    title: "Forms",
    description: "Open your forms, review responses, and manage customer enquiries.",
    href: FORMS_APP_PATH,
    action: "Open forms inbox",
    icon: FormInput,
    accent: "bg-[#f0e8ff] text-[#6b3fa0]",
  },
  {
    title: "AI connections",
    description: "Review the AI apps that can create and publish work for you.",
    href: "/connector/manage",
    action: "Manage connections",
    icon: PlugZap,
    accent: "bg-[#eaf8dc] text-[#416700]",
  },
] as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=/dashboard");

  const [{ checkout }, pages, subscriptionResult] = await Promise.all([
    searchParams,
    getUserPages(),
    getUserSubscription(),
  ]);

  const subscription = subscriptionResult.success
    ? subscriptionResult.data?.subscription
    : null;
  const plan = subscription?.product_id
    ? getBillingPlanByProductId(subscription.product_id)
    : null;
  const firstName = user.firstName || user.username || "there";

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          {checkout === "returned" ? (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#b5dc37] bg-[#f2ffd0] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#1d2a0d]">Checkout complete</p>
                <p className="mt-1 text-sm text-[#5b6848]">Your payment is being confirmed. Plan access normally appears within a few seconds.</p>
              </div>
              <Link href="/billing" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#27350f]">
                Check billing <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}

          <section className="overflow-hidden rounded-[24px] border border-[#dfe3da] bg-[#151914] px-6 py-7 text-white sm:px-8 sm:py-9">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#c1ff00]">Your workspace</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-.04em] sm:text-4xl">Welcome back, {firstName}.</h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#aeb5aa]">Everything your AI creates stays here. Open a page, check a form response, or manage the connection without searching through old conversations.</p>
              </div>
              <Link href="/connector" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c1ff00] px-5 font-semibold text-[#151914] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c1ff00]">
                <Sparkles size={17} /> Use Jobing AI
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 border-t border-[#343b31] pt-5 text-sm text-[#cbd0c8]">
              <span>{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
              <span aria-hidden="true">•</span>
              <span>{plan ? `${plan.name} plan` : "No active paid plan"}</span>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Workspace destinations">
            {destinations.map(({ icon: Icon, ...item }) => (
              <Link key={item.title} href={item.href} className="group flex min-h-[230px] flex-col rounded-[20px] border border-[#dfe3da] bg-white p-6 shadow-[0_10px_35px_rgba(31,40,25,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(31,40,25,.08)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#719500]">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${item.accent}`}><Icon size={20} /></span>
                <h2 className="mt-6 text-xl font-bold tracking-[-.025em] text-[#151914]">{item.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#6e756b]">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#151914]">{item.action}<ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </section>

          <section className="mt-6 flex flex-col gap-5 rounded-[20px] border border-[#dfe3da] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0f1ed] text-[#444c41]"><CreditCard size={20} /></span>
              <div>
                <h2 className="font-bold text-[#151914]">{plan ? `${plan.name} is active` : "Choose a plan when you are ready"}</h2>
                <p className="mt-1 text-sm leading-6 text-[#6e756b]">{plan ? "See invoices, renewal details, or manage your subscription." : "Compare the form and connector limits before you pay."}</p>
              </div>
            </div>
            <Link href={plan ? "/billing" : "/pricing"} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#cfd4cb] px-4 text-sm font-semibold text-[#151914] hover:bg-[#f7f8f4]">
              {plan ? "Manage billing" : "See pricing"}
            </Link>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
