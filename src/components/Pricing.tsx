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
        originalPrice: 999,
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
        name: "Max",
        id: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE || "",
        price: 499,
        originalPrice: 1999,
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
    const [activeTab, setActiveTab] = useState<"Pro" | "Max">("Pro");
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

    const activeTierData = TIERS.find(t => t.name === activeTab) || TIERS[0];

    return (
        <section className="py-8 md:py-20 pb-36 md:pb-20 relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16">
                    <span className="inline-block px-4 py-1.5 mb-4 md:mb-6 text-[13px] font-bold tracking-widest uppercase bg-[#C1FF00] text-[#1a1a1a] rounded-full">
                        PRICING
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1a1a1a] mb-3 md:mb-4">
                        Simple, transparent <span className="bg-[#C1FF00] px-2 rounded text-[#1a1a1a]">pricing</span>
                    </h2>
                    <p className="text-base md:text-lg text-slate-500 font-medium px-4">
                        Choose the plan that fits your workflow. Upgrade or downgrade anytime.
                    </p>
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden flex justify-center mb-8">
                    <div className="bg-slate-200/60 p-1 rounded-full inline-flex w-full max-w-[280px]">
                        <button
                            onClick={() => setActiveTab("Pro")}
                            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${activeTab === "Pro"
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Pro
                        </button>
                        <button
                            onClick={() => setActiveTab("Max")}
                            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${activeTab === "Max"
                                ? 'bg-[#1a1a1a] text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Max
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-center text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {TIERS.map((tier) => {
                        // On mobile, only display the card matching the activeTab
                        const isMobileHidden = activeTab !== tier.name;
                        
                        return (
                            <div
                                key={tier.name}
                                className={`relative flex-col p-6 md:p-8 rounded-2xl border bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${tier.popular
                                    ? 'border-[#C1FF00] shadow-md shadow-[#C1FF00]/10'
                                    : 'border-[#e5e5e5] hover:border-[#d4d4d4]'
                                    } ${isMobileHidden ? 'hidden md:flex' : 'flex'}`}
                            >
                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div className="absolute -top-3.5 left-6 px-4 py-1 bg-[#C1FF00] text-[#1a1a1a] text-xs font-bold tracking-wider uppercase rounded-full shadow-sm">
                                        Most Popular
                                    </div>
                                )}

                                {/* Plan Info */}
                                <div className="mb-6 md:mb-8 mt-2 md:mt-0">
                                    <h3 className="text-2xl font-bold text-slate-950 mb-1">{tier.name}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{tier.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-6 md:mb-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-slate-500 font-bold line-through decoration-slate-400 decoration-2">₹{tier.originalPrice}</span>
                                        <span className="text-[10px] font-black bg-[#C1FF00]/20 text-[#1a1a1a] px-1.5 py-0.5 rounded uppercase tracking-wider">Save {Math.round((1 - tier.price / tier.originalPrice) * 100)}%</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl md:text-5xl font-bold text-slate-950">₹{tier.price}</span>
                                        <span className="text-slate-400 font-bold">/month</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="flex-1 space-y-3 mb-8 md:mb-8">
                                    {tier.features.map((feature) => {
                                        const isComingSoon = feature.includes("(Coming soon)");
                                        const featureText = feature.replace(" (Coming soon)", "");

                                        return (
                                            <li key={feature} className="flex items-start gap-3">
                                                <div className="w-5 h-5 mt-0.5 rounded-md bg-[#C1FF00]/20 flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-3 w-3 text-[#1a1a1a]" />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-slate-600 text-sm font-medium leading-tight">{featureText}</span>
                                                    {isComingSoon && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                                                            Soon
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Desktop CTA (Hidden on Mobile) */}
                                <button
                                    onClick={() => handleSubscribe(tier.id)}
                                    disabled={loadingTier !== null}
                                    className={`hidden md:flex w-full py-3.5 px-6 rounded-xl text-[15px] font-bold transition-all duration-300 justify-center items-center gap-2 cursor-pointer ${tier.popular
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
                                            Get {tier.name}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Note */}
                <p className="hidden md:block text-center text-sm text-slate-400 mt-10 font-medium">
                    Cancel anytime.
                </p>
            </div>

            {/* Mobile Sticky Footer CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div>
                        <p className="text-xs text-slate-500 font-bold mb-0.5">{activeTierData.name} Plan</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-950">₹{activeTierData.price}</span>
                            <span className="text-xs text-slate-400 font-bold">/mo</span>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="text-[10px] font-black bg-[#C1FF00]/20 text-[#1a1a1a] px-1.5 py-0.5 rounded uppercase tracking-wider">
                             Save {Math.round((1 - activeTierData.price / activeTierData.originalPrice) * 100)}%
                         </span>
                    </div>
                </div>
                <button
                    onClick={() => handleSubscribe(activeTierData.id)}
                    disabled={loadingTier !== null}
                    className={`w-full py-3.5 px-6 rounded-xl text-[16px] font-bold transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer ${activeTierData.popular
                        ? 'bg-[#C1FF00] text-[#1a1a1a]'
                        : 'bg-[#1a1a1a] text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loadingTier === activeTierData.id ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Get {activeTierData.name}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </section>
    );
}
