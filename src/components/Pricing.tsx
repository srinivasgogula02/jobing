"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { createSubscriptionCheckout } from "@/app/actions/subscription";
import { getBillingPlans } from "@/lib/billing-plans";

type PricingProps = {
  currentProductId?: string | null;
};

const comparison = [
  { label: "Published pages", pro: "Unlimited", elite: "Unlimited" },
  { label: "Custom forms", pro: "25", elite: "100" },
  { label: "Responses each month", pro: "5,000", elite: "25,000" },
  { label: "AI connector", pro: "Included", elite: "Included" },
  { label: "Support", pro: "Standard", elite: "Priority" },
] as const;

export function Pricing({ currentProductId }: PricingProps) {
  const plans = getBillingPlans();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clerk = useClerk();

  async function choosePlan(productId: string) {
    if (currentProductId) {
      window.location.href = "/billing";
      return;
    }
    if (!productId) {
      setError("Checkout is temporarily unavailable. The plan has not been connected to a payment product.");
      return;
    }
    if (!clerk.user) {
      await clerk.redirectToSignIn({
        signInFallbackRedirectUrl: "/pricing",
        signUpFallbackRedirectUrl: "/pricing",
      });
      return;
    }

    const attemptId = crypto.randomUUID();
    try {
      setLoadingPlan(productId);
      setError(null);
      const result = await createSubscriptionCheckout(productId, attemptId);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
      } else {
        setError("Checkout could not be started. Try again in a moment.");
      }
    } catch {
      setError("Checkout could not be started. Try again in a moment.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main>
      <section className="border-b border-[#e1e4dc] bg-[#f7f8f4] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#719500]">Pricing</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-[-.05em] text-[#151914] sm:text-6xl">Pay for finished work, not another complicated builder.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-8 text-[#687066]">Both plans include the Jobing AI connector, page publishing, native HTML forms, and a dashboard for everything your AI creates.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#555d52]">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#719500]" /> Secure checkout</span>
            <span>Cancel anytime</span>
            <span>Prices in USD</span>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          {error ? (
            <div role="alert" className="mx-auto mb-7 max-w-2xl rounded-xl border border-[#efc0bb] bg-[#fff2f0] p-4 text-center text-sm font-medium text-[#9b3931]">{error}</div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = currentProductId === plan.productId && Boolean(plan.productId);
              const isLoading = loadingPlan === plan.productId && Boolean(plan.productId);
              return (
                <article key={plan.key} className={`relative flex flex-col rounded-[22px] border p-6 sm:p-8 ${plan.highlighted ? "border-[#a9d72a] bg-[#fbfff1] shadow-[0_18px_55px_rgba(92,120,19,.12)]" : "border-[#dfe3da] bg-white"}`}>
                  {plan.highlighted ? <span className="absolute right-5 top-5 rounded-full bg-[#151914] px-3 py-1 font-mono text-[9px] uppercase tracking-[.1em] text-white">Most popular</span> : null}
                  <div className="pr-24">
                    <h2 className="text-2xl font-bold tracking-[-.03em] text-[#151914]">{plan.name}</h2>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-[#6e756b]">{plan.description}</p>
                  </div>
                  <div className="mt-7 flex items-end gap-2 border-b border-[#e3e7df] pb-7">
                    <span className="text-5xl font-bold tracking-[-.05em] text-[#151914]">${plan.price}</span>
                    <span className="pb-1 text-sm font-medium text-[#7a8176]">per month</span>
                  </div>
                  <ul className="my-7 flex-1 space-y-3.5">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-[#4f574c]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#dff49e] text-[#3f5e00]"><Check size={12} strokeWidth={3} /></span>{feature}</li>)}
                  </ul>
                  <button type="button" onClick={() => choosePlan(plan.productId)} disabled={isLoading || isCurrent} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${plan.highlighted ? "bg-[#c1ff00] text-[#151914] hover:bg-[#b5ef08]" : "bg-[#151914] text-white hover:bg-[#293025]"} disabled:cursor-not-allowed disabled:opacity-60`}>
                    {isLoading ? <><Loader2 size={17} className="animate-spin" /> Opening secure checkout</> : isCurrent ? "Current plan" : currentProductId ? <>Manage subscription <ArrowRight size={16} /></> : <>Choose {plan.name} <ArrowRight size={16} /></>}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-16 overflow-hidden rounded-[20px] border border-[#dfe3da]">
            <div className="border-b border-[#e5e8e1] bg-[#f7f8f4] px-5 py-5 sm:px-7"><h2 className="text-xl font-bold text-[#151914]">Compare the limits that matter</h2><p className="mt-1 text-sm text-[#6e756b]">No hidden feature matrix. Choose based on the volume you expect.</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-[#e8ebe5] font-mono text-[10px] uppercase tracking-[.1em] text-[#7b8277]"><th className="px-5 py-4 sm:px-7">Included</th><th className="px-5 py-4">Pro</th><th className="bg-[#fbfff1] px-5 py-4">Elite</th></tr></thead>
                <tbody>{comparison.map((row) => <tr key={row.label} className="border-b border-[#eef0ec] last:border-0"><th className="px-5 py-4 font-medium text-[#555d52] sm:px-7">{row.label}</th><td className="px-5 py-4 font-semibold text-[#151914]">{row.pro}</td><td className="bg-[#fbfff1] px-5 py-4 font-semibold text-[#151914]">{row.elite}</td></tr>)}</tbody>
              </table>
            </div>
          </div>

          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-[-.03em] text-[#151914]">Before you pay</h2>
            <div className="mt-7 divide-y divide-[#e5e8e1] border-y border-[#e5e8e1]">
              <details className="group py-5"><summary className="cursor-pointer list-none font-semibold text-[#151914]">What happens after checkout?</summary><p className="mt-3 text-sm leading-6 text-[#6e756b]">Dodo Payments returns you to your Jobing AI dashboard. The signed webhook activates your plan, updates your Forms limits, and records the invoice.</p></details>
              <details className="group py-5"><summary className="cursor-pointer list-none font-semibold text-[#151914]">Can I cancel?</summary><p className="mt-3 text-sm leading-6 text-[#6e756b]">Yes. Cancel from Billing and keep access until the end of the paid billing period.</p></details>
              <details className="group py-5"><summary className="cursor-pointer list-none font-semibold text-[#151914]">What happens to my work if I cancel?</summary><p className="mt-3 text-sm leading-6 text-[#6e756b]">Published pages stay available. Your Forms workspace returns to the standard five-form limit, and existing responses remain in your inbox.</p></details>
            </div>
          </section>

          <div className="mt-14 text-center"><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#151914]">Go to dashboard <ArrowRight size={16} /></Link></div>
        </div>
      </section>
    </main>
  );
}
