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
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardConnectorStrip } from "@/components/DashboardConnectorStrip";
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

  const [{ checkout }, subscriptionResult] = await Promise.all([
    searchParams,
    getUserSubscription(),
  ]);

  const subscription = subscriptionResult.success
    ? subscriptionResult.data?.subscription
    : null;
  const plan = subscription?.product_id
    ? getBillingPlanByProductId(subscription.product_id)
    : null;
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

          <DashboardConnectorStrip />

          <section className="mt-4 grid gap-4 md:grid-cols-3" aria-label="Workspace destinations">
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
