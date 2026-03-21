"use client";

import { useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/subscription";

// Product IDs from env vars (set in .env.local)
const TIERS = [
    {
        name: "Pro",
        id: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || "",
        price: 29,
        description: "For professional prompt engineers.",
        features: [
            "500 Credits per month",
            "Priority support",
            "Advanced models",
            "Early access to new features"
        ],
        popular: true
    },
    {
        name: "Elite",
        id: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE || "",
        price: 79,
        description: "For teams and power users.",
        features: [
            "2,000 Credits per month",
            "Dedicated support",
            "All models + custom fine-tuning",
            "API access",
            "Team collaboration"
        ],
    }
];

export function Pricing() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async (productId: string) => {
        try {
            setLoadingTier(productId);
            setError(null);
            const res = await createSubscriptionCheckout(productId);

            if (res.error) {
                setError(res.error);
            } else if (res.url) {
                window.location.href = res.url;
            } else {
                setError("Could not generate checkout session.");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <section className="py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-yellow-400 text-black rounded-full">
                        PRICING
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-4">
                        Simple, transparent <span className="text-yellow-400">pricing</span>
                    </h2>
                    <p className="text-lg text-slate-500 font-medium">
                        Choose the plan that fits your workflow. Upgrade or downgrade anytime.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-center text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative flex flex-col p-8 rounded-2xl border bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${tier.popular
                                ? 'border-yellow-400 shadow-md shadow-yellow-100'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div className="absolute -top-3.5 left-6 px-4 py-1 bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase rounded-full">
                                    Most Popular
                                </div>
                            )}

                            {/* Plan Info */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-950 mb-1">{tier.name}</h3>
                                <p className="text-slate-500 text-sm font-medium">{tier.description}</p>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-bold text-slate-950">${tier.price}</span>
                                <span className="text-slate-400 font-medium">/month</span>
                            </div>

                            {/* Features */}
                            <ul className="flex-1 space-y-3 mb-8">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-3 w-3 text-yellow-600" />
                                        </div>
                                        <span className="text-slate-600 text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => handleSubscribe(tier.id)}
                                disabled={loadingTier !== null}
                                className={`yellow-glow w-full py-3.5 px-6 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer ${tier.popular
                                    ? 'bg-yellow-400 hover:bg-black hover:text-white text-black'
                                    : 'bg-slate-950 hover:bg-slate-800 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loadingTier === tier.id ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-slate-400 mt-10 font-medium">
                    All plans include a 7-day money-back guarantee. Cancel anytime.
                </p>
            </div>
        </section>
    );
}
