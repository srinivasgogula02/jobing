"use client";

import { useState, useTransition } from "react";
import {
    CreditCard, ReceiptText, Calendar, Download,
    Loader2, AlertTriangle, CheckCircle2, RotateCcw, ArrowRight
} from "lucide-react";
import Link from "next/link";
import {
    cancelSubscription,
    changePlan,
    restoreSubscription,
} from "@/app/actions/billing";
import { getBillingPlanByProductId, getBillingPlans } from "@/lib/billing-plans";

// ─────────────────────────────────
// Types
// ─────────────────────────────────
interface Subscription {
    subscription_id: string;
    product_id: string;
    status: string;
    currency: string;
    recurring_pre_tax_amount: number;
    next_billing_date: string;
    previous_billing_date: string;
    cancel_at_next_billing_date: boolean;
    cancelled_at: string | null;
    created_at: string;
    payment_period_interval: string;
    subscription_period_interval: string;
    customer_email: string;
    metadata: Record<string, unknown> | null;
}

interface Payment {
    payment_id: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    payment_method: string | null;
    card_network: string | null;
    card_last_four: string | null;
    card_type: string | null;
}

interface BillingDashboardProps {
    subscription: Subscription | null;
    invoices: Payment[];
    isLiveMode: boolean;
}

// ─────────────────────────────────
// Main Component
// ─────────────────────────────────
export function BillingDashboard({
    subscription,
    invoices,
    isLiveMode,
}: BillingDashboardProps) {
    const [activeTab, setActiveTab] = useState<"billing" | "invoices">("billing");

    const tabs = [
        { id: "billing" as const, label: "Billing", icon: CreditCard },
        { id: "invoices" as const, label: "Invoices", icon: ReceiptText },
    ];

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-6 md:px-0 md:py-0">
            <div className="mb-6">
                <p className="text-[#6b7280] font-medium">Manage your plan and payment history.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm mb-8">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                                ? "bg-slate-950 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === "billing" && (
                <SubscriptionPanel subscription={subscription} />
            )}
            {activeTab === "invoices" && (
                <InvoicesPanel invoices={invoices} isLiveMode={isLiveMode} />
            )}
        </div>
    );
}

// ─────────────────────────────────
// Subscription Panel
// ─────────────────────────────────
function SubscriptionPanel({ subscription }: { subscription: Subscription | null }) {
    const [isPending, startTransition] = useTransition();
    const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleCancel = () => {
        if (!subscription) return;
        if (!confirm("Are you sure? You'll keep access until your billing period ends.")) return;

        startTransition(async () => {
            const res = await cancelSubscription(subscription.subscription_id);
            if (res.success) {
                setActionMsg({ type: "success", text: "Subscription cancelled. You'll keep access until the end of your billing period." });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setActionMsg({ type: "error", text: res.error || "Failed to cancel." });
            }
        });
    };

    const handleRestore = () => {
        if (!subscription) return;
        startTransition(async () => {
            const res = await restoreSubscription(subscription.subscription_id);
            if (res.success) {
                setActionMsg({ type: "success", text: "Subscription restored! You'll continue to be billed." });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setActionMsg({ type: "error", text: res.error || "Failed to restore." });
            }
        });
    };

    const handlePlanChange = (newProductId: string) => {
        if (!subscription) return;
        if (!confirm("Change plan now? Dodo Payments may apply a prorated charge or credit.")) return;
        startTransition(async () => {
            const res = await changePlan(subscription.subscription_id, newProductId);
            if (res.success) {
                setActionMsg({ type: "success", text: "Plan change requested. Your limits will update after payment confirmation." });
                setTimeout(() => window.location.reload(), 1800);
            } else {
                setActionMsg({ type: "error", text: res.error || "The plan could not be changed." });
            }
        });
    };

    // No subscription state
    if (!subscription) {
        return (
            <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 p-6 md:p-10 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                    <CreditCard size={28} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">No active subscription</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
                    Choose a plan to increase your Forms limits and support level. Cancel anytime.
                </p>
                <Link
                    href="/pricing"
                    className="yellow-glow inline-flex items-center gap-2 px-8 py-3.5 bg-[#C1FF00] hover:opacity-90 text-[#1a1a1a] font-bold rounded-xl transition-all duration-300"
                >
                    View Plans
                    <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    const isActive = subscription.status === "active";
    const isCancelling = subscription.cancel_at_next_billing_date;
    const price = (subscription.recurring_pre_tax_amount / 100).toFixed(2);
    const currency = subscription.currency === "USD" ? "$" : subscription.currency;
    const interval = subscription.payment_period_interval === "Month" ? "mo" : subscription.payment_period_interval === "Year" ? "yr" : "";
    const currentPlan = getBillingPlanByProductId(subscription.product_id);
    const availablePlans = getBillingPlans().filter((plan) => plan.productId && plan.productId !== subscription.product_id);

    return (
        <div className="space-y-6">
            {/* Action Messages */}
            {actionMsg && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-medium text-sm ${actionMsg.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                    {actionMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {actionMsg.text}
                </div>
            )}

            {/* Main Subscription Card */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 overflow-hidden shadow-sm">
                {/* Cancellation Banner */}
                {isCancelling && (
                    <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <span className="text-sm text-amber-700 font-medium">
                            Scheduled for cancellation at end of billing period
                        </span>
                    </div>
                )}

                <div className="p-6">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-slate-950">Current Plan</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                    }`}>
                                    {subscription.status}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">{currentPlan ? `${currentPlan.name} plan` : "Jobing AI subscription"}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-slate-950">{currency}{price}</span>
                            <span className="text-slate-400 font-medium">/{interval}</span>
                        </div>
                    </div>

                    {/* Billing Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1.5">
                                <Calendar size={14} />
                                {isCancelling ? "Cancels on" : "Next billing date"}
                            </div>
                            <p className="text-slate-950 font-bold">
                                {new Date(subscription.next_billing_date).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1.5">
                                <Calendar size={14} />
                                Member since
                            </div>
                            <p className="text-slate-950 font-bold">
                                {new Date(subscription.created_at).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {!isCancelling && isActive && (
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-5 py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-sm font-bold rounded-xl transition-colors border border-slate-200 hover:border-red-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                                Cancel Subscription
                            </button>
                        )}
                        {isCancelling && (
                            <button
                                onClick={handleRestore}
                                disabled={isPending}
                                className="yellow-glow px-5 py-2.5 bg-[#C1FF00] hover:opacity-90 text-[#1a1a1a] text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                Keep My Subscription
                            </button>
                        )}
                    </div>

                    {availablePlans.length > 0 && isActive && !isCancelling ? (
                        <div className="mt-7 border-t border-slate-200 pt-6">
                            <p className="text-sm font-bold text-slate-950">Change plan</p>
                            <p className="mt-1 text-sm text-slate-500">The price difference is prorated immediately.</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {availablePlans.map((plan) => (
                                    <button key={plan.key} type="button" onClick={() => handlePlanChange(plan.productId)} disabled={isPending} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                        Switch to {plan.name} · ${plan.price}/mo
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────
// Invoices Panel
// ─────────────────────────────────
function InvoicesPanel({ invoices, isLiveMode }: { invoices: Payment[]; isLiveMode: boolean }) {
    const dodoBaseUrl = isLiveMode
        ? "https://live.dodopayments.com"
        : "https://test.dodopayments.com";

    if (!invoices || invoices.length === 0) {
        return (
            <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 p-6 md:p-10 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                    <ReceiptText size={28} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">No invoices yet</h3>
                <p className="text-slate-500 font-medium">Your payment history will appear here once you subscribe.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C1FF00]/20 flex items-center justify-center">
                        <ReceiptText size={16} className="text-[#8bb800]" />
                    </div>
                    Invoice History
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Your past payments and receipts.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Date</th>
                            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Amount</th>
                            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Method</th>
                            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                            <tr key={inv.payment_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(inv.created_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-950 font-bold text-right whitespace-nowrap">
                                    {inv.currency === "USD" ? "$" : inv.currency}
                                    {(inv.total_amount / 100).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${inv.status === "succeeded"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}>
                                        {inv.status === "succeeded" ? "Paid" : inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium text-right whitespace-nowrap">
                                    {inv.card_network && inv.card_last_four
                                        ? `${inv.card_network} •••• ${inv.card_last_four}`
                                        : inv.payment_method || "—"}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <a
                                        href={`${dodoBaseUrl}/invoices/payments/${inv.payment_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                                    >
                                        <Download size={12} />
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
