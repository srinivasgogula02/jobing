"use client";

import { useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/subscription";
import { useClerk } from "@clerk/nextjs";

// Product IDs from env vars (set in .env.local)
const TIERS = [
    {
        name: "Pro",
        id: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || "",
        price: 249,
        description: "Perfect for active job seekers needing multiple tailored resumes.",
        features: [
            "50 Resumes per month",
            "Priority support",
            "Advanced ATS-optimization models",
            "Early access to new features"
        ],
        popular: true
    },
    {
        name: "Elite",
        id: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE || "",
        price: 499,
        description: "For extreme power users applying to hundreds of jobs.",
        features: [
            "150 Resumes per month",
            "Dedicated support",
            "All models + ultimate tailoring",
            "API access (Coming soon)",
        ],
    }
];

export function Pricing() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const clerk = useClerk();

    const handleSubscribe = async (productId: string) => {
        if (!clerk.user) {
            clerk.redirectToSignIn({ signInFallbackRedirectUrl: '/pricing' });
            return;
        }

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
                    <span className="inline-block px-4 py-1.5 mb-6 text-[13px] font-bold tracking-widest uppercase bg-[#C1FF00] text-[#1a1a1a] rounded-full">
                        PRICING
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1a1a1a] mb-4">
                        Simple, transparent <span className="bg-[#C1FF00] px-2 rounded text-[#1a1a1a]">pricing</span>
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
                                ? 'border-[#C1FF00] shadow-md shadow-[#C1FF00]/10'
                                : 'border-[#e5e5e5] hover:border-[#d4d4d4]'
                                }`}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div className="absolute -top-3.5 left-6 px-4 py-1 bg-[#C1FF00] text-[#1a1a1a] text-xs font-bold tracking-wider uppercase rounded-full">
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
                                <span className="text-5xl font-bold text-slate-950">₹{tier.price}</span>
                                <span className="text-slate-400 font-medium">/month</span>
                            </div>

                            {/* Features */}
                            <ul className="flex-1 space-y-3 mb-8">
                                {tier.features.map((feature) => {
                                    const isComingSoon = feature.includes("(Coming soon)");
                                    const featureText = feature.replace(" (Coming soon)", "");
                                    
                                    return (
                                        <li key={feature} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-md bg-[#C1FF00]/20 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-[#1a1a1a]" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600 text-sm font-medium">{featureText}</span>
                                                {isComingSoon && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => handleSubscribe(tier.id)}
                                disabled={loadingTier !== null}
                                className={`yellow-glow w-full py-3.5 px-6 pt-4 rounded-xl text-[15px] font-bold transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer ${tier.popular
                                    ? 'bg-[#C1FF00] hover:opacity-90 text-[#1a1a1a]'
                                    : 'bg-[#1a1a1a] hover:bg-[#333333] text-white'
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
                    Cancel anytime.
                </p>
            </div>
        </section>
    );
}
