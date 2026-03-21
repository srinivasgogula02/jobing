"use client";

import { useState } from "react";
import { cancelSubscription } from "@/app/actions";
import { Loader2, Settings } from "lucide-react";

export function ManageSubscriptionButton({ subscriptionId }: { subscriptionId?: string | null }) {
    const [isLoading, setIsLoading] = useState(false);

    if (!subscriptionId) return null;

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your billing cycle.")) return;

        setIsLoading(true);
        try {
            const res = await cancelSubscription(subscriptionId);
            if (!res.success) {
                alert(`Error: ${res.error}`);
            } else {
                alert("Your subscription cancellation has been initiated.");
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to cancel subscription.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold rounded-lg transition-colors text-sm"
        >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Settings size={16} />}
            <span>Cancel Subscription</span>
        </button>
    );
}
